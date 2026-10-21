import {createClient} from 'npm:@supabase/supabase-js@2';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
Deno.serve(async req => {
 if(req.method!=='POST')return new Response('POST only',{status:405});
 const secret=Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
 const url=Deno.env.get('SUPABASE_URL');
 const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 if(!secret||!url||!key) return new Response('Not configured',{status:503});
 if(req.headers.get('authorization')!=='Bearer '+secret)return new Response('Unauthorized',{status:401});
 const body=await req.json().catch(()=>null);
 const e=body?.event;
 if(!e||!e.id||!e.app_user_id)return new Response('Invalid event',{status:400});
 const userId=String(e.app_user_id);
 if(!UUID.test(userId))return new Response('Unmapped user; ignored',{status:200});
 const admin=createClient(url,key,{auth:{persistSession:false}});
 const {error:lockError}=await admin.from('billing_events').insert({event_id:e.id});
 if(lockError){
   if(lockError.code==='23505')return new Response('Duplicate',{status:200});
   return new Response('Event persistence failed',{status:500});
 }
 // This event ID deduplication ensures duplicate deliveries are safe, but
 // production deployments should process subscription update in a SQL transaction.
 const expiresMs=Number(e.expiration_at_ms || 0);
 const eventMs=Number(e.event_timestamp_ms || Date.now());
 const {data:old}=await admin.from('subscriptions').select('last_event_ms,expires_at').eq('user_id',userId).maybeSingle();
 if(old && eventMs < Number(old.last_event_ms)) return new Response('Old event',{status:200});
 const expiresAt=Number.isFinite(expiresMs)&&expiresMs>0?new Date(expiresMs).toISOString():null;
 if(!expiresAt)return new Response('No subscription expiry; ignored',{status:200});
 const {error:writeError}=await admin.from('subscriptions').upsert({
   user_id:userId,expires_at:expiresAt,last_event_ms:eventMs,updated_at:new Date().toISOString()
 });
 if(writeError)return new Response('Subscription update failed',{status:500});
 return new Response('OK',{status:200});
});
