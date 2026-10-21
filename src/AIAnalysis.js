import React,{useEffect,useState} from 'react';
import {View,Text,TextInput,TouchableOpacity,ActivityIndicator,Image,Alert,StyleSheet,ScrollView} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import {supabase} from './supabase';
const dark='#11293e',teal='#007f83';
const Button=({title,onPress,disabled=false,secondary=false})=><TouchableOpacity disabled={disabled} onPress={onPress} style={[s.btn,secondary&&{backgroundColor:'#e9f1f2'},disabled&&{opacity:.6}]}><Text style={[s.btnText,secondary&&{color:dark}]}>{title}</Text></TouchableOpacity>;
export default function AIAnalysis(){
 const [session,setSession]=useState(null),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[loading,setLoading]=useState(false);
 const [photo,setPhoto]=useState(null),[question,setQuestion]=useState('Calculate measurable quantities from this civil engineering drawing. Clearly identify unknown dimensions.'),[answer,setAnswer]=useState(''),[usage,setUsage]=useState(null),[entitlement,setEntitlement]=useState(null);
 useEffect(()=>{
   supabase.auth.getSession().then(({data})=>setSession(data.session)).catch(()=>{});
   const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>setSession(next));
   return ()=>subscription.unsubscribe();
 },[]);
 useEffect(()=>{
  if(!session){setUsage(null);setEntitlement(null);return;}
  (async()=>{
   const {data:u}=await supabase.from('ai_usage').select('free_used,monthly_used,month_bucket').eq('user_id',session.user.id).maybeSingle();
   const {data:e}=await supabase.from('subscription_entitlements').select('status,expires_at').eq('user_id',session.user.id).maybeSingle();
   setUsage(u||{free_used:0,monthly_used:0});setEntitlement(e||null);
  })();
 },[session,answer]);
 const authenticate=async(mode)=>{
  if(!email.includes('@')||password.length<8){Alert.alert('Check details','Enter a valid email address and password of at least 8 characters.');return;}
  setLoading(true);
  try{
   const {data,error}= mode==='register'?await supabase.auth.signUp({email:email.trim().toLowerCase(),password}):await supabase.auth.signInWithPassword({email:email.trim().toLowerCase(),password});
   if(error)throw error;
   if(mode==='register'&&!data.session)Alert.alert('Confirm your email','Check your inbox and confirm your account before signing in.');
  }catch(e){Alert.alert('Authentication',e.message||'Unable to sign in.');}
  finally{setLoading(false);}
 };
 const pick=async(camera)=>{
  try{
   if(camera){const perm=await ImagePicker.requestCameraPermissionsAsync();if(!perm.granted){Alert.alert('Camera permission needed','Allow CivilQuant camera access to take a photo.');return;}}
   const out=camera?await ImagePicker.launchCameraAsync({mediaTypes:['images'],quality:.55,allowsEditing:false}):await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],quality:.55,allowsEditing:false});
   if(!out.canceled){setPhoto(out.assets[0]);setAnswer('');}
  }catch(e){Alert.alert('Photo unavailable',e.message||'Could not read the selected photo.');}
 };
 const analyze=async()=>{
  if(!session||!photo){Alert.alert('Drawing required','Sign in and select a drawing or photo.');return;}
  if(!question.trim()){Alert.alert('Question required','Ask what you need calculated.');return;}
  setLoading(true);setAnswer('');
  try{
   const imgData=await FileSystem.readAsStringAsync(photo.uri,{encoding:FileSystem.EncodingType.Base64});
   if(imgData.length>6_500_000){Alert.alert('Image too large','Use a lower-resolution photograph.');return;}
   const mime=photo.mimeType==='image/png'?'image/png':photo.mimeType==='image/webp'?'image/webp':'image/jpeg';
   const {data,error}=await supabase.functions.invoke('ai-analyze',{body:{image:'data:'+mime+';base64,'+imgData,question:question.trim()}});
   if(error){let detail=error.message;try{if(error.context&&typeof error.context.json==='function'){const response=await error.context.json();detail=response.message||response.error||detail;}}catch{}throw new Error(detail);}
   if(!data?.answer)throw new Error(data?.message||data?.error||'No analysis returned.');
   setAnswer(data.answer);
  }catch(e){Alert.alert('AI analysis unavailable',e.message||'The service is not yet ready.');}
  finally{setLoading(false);}
 };
 return <View style={s.panel}><Text style={s.title}>AI Drawing Analysis</Text>
 {!session?<><Text style={s.notice}>Sign in to use server-verified image analysis and your free allowance.</Text><TextInput style={s.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="Email"/><TextInput style={s.input} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" placeholder="Password (minimum 8 characters)"/><Button title="Sign in" onPress={()=>authenticate('login')} disabled={loading}/><Button title="Create account" onPress={()=>authenticate('register')} disabled={loading} secondary/></>:
 <>
 <Text style={s.notice}>Signed in: {session.user.email||'Account'} · Free uses: {Math.max(0,3-(usage?.free_used||0))}/3{entitlement?.status==='active'?' · Pro active':''}</Text>
 <Button title="Take drawing photo" onPress={()=>pick(true)} secondary/><Button title="Choose drawing photo" onPress={()=>pick(false)} secondary/>
 {photo&&<Image source={{uri:photo.uri}} style={s.image} resizeMode="contain"/>}
 <Text style={s.label}>What should CivilQuant calculate?</Text>
 <TextInput style={[s.input,{height:95,textAlignVertical:'top'}]} multiline value={question} onChangeText={setQuestion} placeholder="E.g., concrete and steel quantities. Units and dimensions..." />
 <Button title={loading?'Analyzing…':'Analyze drawing / photo'} onPress={analyze} disabled={loading||!photo}/>{loading&&<ActivityIndicator color={teal}/>}
 {answer?<View style={s.result}><Text style={s.resultHeading}>AI calculation (verify before use)</Text><Text selectable style={s.answer}>{answer}</Text></View>:null}
 <Button title="Sign out" onPress={()=>supabase.auth.signOut()} disabled={loading} secondary/>
 </>
 }
 <Text style={s.disclaimer}>Image-derived estimates are not certified engineering measurements. Missing scale and unseen dimensions cannot be calculated reliably. Provider access and subscription eligibility are managed by the backend.</Text>
 </View>;
}
const s=StyleSheet.create({panel:{backgroundColor:'white',padding:18,borderRadius:16,borderWidth:1,borderColor:'#d9e8ea',marginBottom:16},title:{fontSize:20,fontWeight:'800',color:dark,marginBottom:12},notice:{color:'#587282',fontSize:13,marginBottom:12},input:{borderWidth:1,borderColor:'#b6cdd3',borderRadius:9,padding:12,marginBottom:12,color:dark},btn:{backgroundColor:teal,padding:14,borderRadius:9,alignItems:'center',marginTop:9},btnText:{color:'white',fontWeight:'700'},image:{height:240,width:'100%',marginVertical:10},label:{fontWeight:'700',color:dark,marginTop:15,marginBottom:8},disclaimer:{fontSize:11,color:'#697b86',marginTop:16},result:{backgroundColor:'#f0f9f9',padding:12,borderRadius:10,marginTop:15},resultHeading:{fontWeight:'700',marginBottom:8,color:dark},answer:{fontSize:13,lineHeight:20,color:dark}});
