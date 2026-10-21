import {createClient} from 'npm:@supabase/supabase-js@2';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
Deno.serve(async req=>{
 if(req.method!=='POST') return new Response('POST only',{status:405});
 const secret=Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
 const url=Deno.env.get('SUPABASE_URL');
 const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 if(!secret || !url || !key) return new Response('Not configured',{status:503});
 if(req.headers.get('authorization')!=='Bearer '+secret)return new Response('Unauthorized',{status:401});
 const e=(await req.json().catch(()=>null))?.event;
 if(!e?.id || !e?.app_user_id)return new Response('Bad event',{status:400});
 const userId=String(e.app_user_id);
 if(!UUID.test(userId))return new Response('Unmapped user',{status:200});
 const validEvents=new Set(['INITIAL_PURCHASE','RENEWAL','PRODUCT_CHANGE','CANCELLATION','EXPIRATION','BILLING_ISSUE','SUBSCRIPTION_EXTENDED','UNCANCELLATION','NON_RENEWING_PURCHASE']);
 if(e.environment!=='PRODUCTION'||!validEvents.has(String(e.type||'')))return new Response('Ignored non-production or non-subscription event',{status:200});
 if(!Array.isArray(e.entitlement_ids)||!e.entitlement_ids.includes('civilquant_pro'))return new Response('Ignored unrelated entitlement',{status:200});
 const expiry=Number(e.expiration_at_ms||0);
 const event=Number(e.event_timestamp_ms||Date.now());
 const expiresAt=expiry>0&&Number.isFinite(expiry)?new Date(expiry).toISOString():null;
 const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await client.rpc('apply_billing_event',{
   p_event_id:String(e.id),p_user_id:userId,p_event_ms:event,p_expires_at:expiresAt
 });
 if(error)return new Response('Temporary update error',{status:500});
 return new Response(String(data||'OK'),{status:200});
});
