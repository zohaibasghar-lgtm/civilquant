-- Transactional, idempotent RevenueCat event ingestion.
create or replace function public.apply_billing_event(
 p_event_id text,p_user_id uuid,p_event_ms bigint,p_expires_at timestamptz
) returns text language plpgsql security definer set search_path=public,pg_temp as $$
declare v_old bigint;
begin
 if length(p_event_id)<1 or length(p_event_id)>300 or p_event_ms<0 then
  raise exception 'Invalid event';
 end if;
 insert into public.billing_events(event_id) values(p_event_id) on conflict do nothing;
 if not found then return 'duplicate'; end if;
 insert into public.subscriptions(user_id) values(p_user_id) on conflict do nothing;
 select last_event_ms into v_old from public.subscriptions where user_id=p_user_id for update;
 if p_event_ms >= coalesce(v_old,0) and p_expires_at is not null then
  update public.subscriptions
    set expires_at=p_expires_at,last_event_ms=p_event_ms,updated_at=now()
  where user_id=p_user_id;
  return 'updated';
 end if;
 return 'ignored';
end;
$$;
revoke all on function public.apply_billing_event(text,uuid,bigint,timestamptz) from public,anon,authenticated;
grant execute on function public.apply_billing_event(text,uuid,bigint,timestamptz) to service_role;
