-- CivilQuant 1.1: secure AI quotas and subscription entitlements.
-- Apply with Supabase migrations before deploying Edge Functions.
create table if not exists public.ai_usage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  free_used integer not null default 0 check (free_used between 0 and 3),
  paid_period_start timestamptz,
  paid_used integer not null default 0 check (paid_used >= 0)
);
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  expires_at timestamptz,
  last_event_ms bigint not null default 0,
  updated_at timestamptz not null default now()
);
create table if not exists public.ai_requests (
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  tier text not null check (tier in ('free','pro')),
  status text not null default 'reserved' check (status in ('reserved','done','failed')),
  result jsonb,
  created_at timestamptz not null default now(),
  primary key (user_id, request_id)
);
create table if not exists public.billing_events (
  event_id text primary key,
  processed_at timestamptz not null default now()
);
alter table public.ai_usage enable row level security;
alter table public.subscriptions enable row level security;
alter table public.ai_requests enable row level security;
alter table public.billing_events enable row level security;
revoke all on public.ai_usage, public.subscriptions, public.ai_requests, public.billing_events from anon, authenticated;
grant select on public.ai_usage, public.subscriptions to authenticated;
create policy "users read own usage" on public.ai_usage for select to authenticated using (auth.uid()=user_id);
create policy "users read own subscription" on public.subscriptions for select to authenticated using (auth.uid()=user_id);

create or replace function public.reserve_ai_attempt(p_user_id uuid, p_request_id uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp
as $$
declare
 u public.ai_usage%rowtype;
 a public.ai_requests%rowtype;
 pro_until timestamptz;
 tier text;
 remaining integer;
begin
 insert into public.ai_usage(user_id) values(p_user_id) on conflict do nothing;
 select * into u from public.ai_usage where user_id=p_user_id for update;
 select * into a from public.ai_requests where user_id=p_user_id and request_id=p_request_id;
 if found then
   return jsonb_build_object('allowed',false,'reason','duplicate','status',a.status,'result',a.result);
 end if;
 select expires_at into pro_until from public.subscriptions where user_id=p_user_id;
 if pro_until > now() then
   tier:='pro';
   if u.paid_period_start is null or u.paid_period_start < now()-interval '30 days' then
     u.paid_period_start:=now();
     u.paid_used:=0;
   end if;
   if u.paid_used>=20 then
     return '{"allowed":false,"reason":"pro_limit"}'::jsonb;
   end if;
   u.paid_used:=u.paid_used+1;
   remaining:=20-u.paid_used;
 else
   tier:='free';
   if u.free_used>=3 then
     return '{"allowed":false,"reason":"trial_exhausted"}'::jsonb;
   end if;
   u.free_used:=u.free_used+1;
   remaining:=3-u.free_used;
 end if;
 update public.ai_usage set free_used=u.free_used,paid_period_start=u.paid_period_start,paid_used=u.paid_used where user_id=p_user_id;
 insert into public.ai_requests(user_id,request_id,tier) values(p_user_id,p_request_id,tier);
 return jsonb_build_object('allowed',true,'tier',tier,'remaining',remaining);
end;
$$;

create or replace function public.complete_ai_attempt(p_user_id uuid,p_request_id uuid,p_result jsonb)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 update public.ai_requests
    set status='done',result=p_result
  where user_id=p_user_id and request_id=p_request_id and status='reserved';
end;
$$;

create or replace function public.refund_ai_attempt(p_user_id uuid,p_request_id uuid)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare v_tier text;
begin
 -- Serialize refunds/reservations against the account row.
 perform 1 from public.ai_usage where user_id=p_user_id for update;
 update public.ai_requests set status='failed'
 where user_id=p_user_id and request_id=p_request_id and status='reserved'
 returning tier into v_tier;
 if not found then return; end if;
 if v_tier='free' then
   update public.ai_usage set free_used=greatest(0,free_used-1) where user_id=p_user_id;
 else
   update public.ai_usage set paid_used=greatest(0,paid_used-1) where user_id=p_user_id;
 end if;
end;
$$;

revoke all on function public.reserve_ai_attempt(uuid,uuid) from public,anon,authenticated;
revoke all on function public.complete_ai_attempt(uuid,uuid,jsonb) from public,anon,authenticated;
revoke all on function public.refund_ai_attempt(uuid,uuid) from public,anon,authenticated;
grant execute on function public.reserve_ai_attempt(uuid,uuid) to service_role;
grant execute on function public.complete_ai_attempt(uuid,uuid,jsonb) to service_role;
grant execute on function public.refund_ai_attempt(uuid,uuid) to service_role;
