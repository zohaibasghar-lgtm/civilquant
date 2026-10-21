import {createClient} from 'npm:@supabase/supabase-js@2';
const cors={
'Access-Control-Allow-Origin':'*',
'Access-Control-Allow-Methods':'POST, OPTIONS',
'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info'};
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{headers:cors});
 if(req.method!=='POST')return new Response('Method not allowed',{status:405,headers:cors});
 const url=Deno.env.get('SUPABASE_URL'),pub=Deno.env.get('SUPABASE_ANON_KEY'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 if(!url||!pub||!key)return new Response('Not configured',{status:503,headers:cors});
 const token=req.headers.get('authorization')?.replace(/^Bearer\s+/i,'');
 if(!token)return new Response('Unauthorized',{status:401,headers:cors});
 const auth=createClient(url,pub,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await auth.auth.getUser(token);
 if(error||!data.user)return new Response('Invalid user session',{status:401,headers:cors});
 const body=await req.json().catch(()=>null);
 if(body?.confirm!==true)return new Response('Confirmation required',{status:400,headers:cors});
 const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const removed=await admin.auth.admin.deleteUser(data.user.id);
 if(removed.error)return new Response('Deletion failed',{status:500,headers:cors});
 return new Response(JSON.stringify({deleted:true,note:'Store subscriptions must be cancelled separately.'}),{status:200,headers:{...cors,'Content-Type':'application/json'}});
});
