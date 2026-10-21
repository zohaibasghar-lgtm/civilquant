import React,{useState,useEffect} from 'react';
import {SafeAreaView,ScrollView,View,Text,TextInput,TouchableOpacity,Alert,Image,StatusBar,StyleSheet} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AIAnalysis from './src/AIAnalysis';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';
import {recognizeText} from 'expo-mlkit-ocr';
import {supabase,hasCloud} from './src/cloud';
import {setupPurchases,hasBilling,listPackages,buyPackage,restorePurchases,manageSubscription,currentProEntitlement} from './src/purchases';
import {CivilQuantBanner} from './src/ads';
import {barBbs,takeoff,ITEMS,round} from './src/engineering';
const teal='#007f83', ink='#11293e';
const Label=({children})=><Text style={s.label}>{children}</Text>;
const Field=({label,value,onChangeText,keyboardType='decimal-pad'})=><View style={{flex:1,minWidth:120}}><Label>{label}</Label><TextInput style={s.field} value={value} onChangeText={onChangeText} keyboardType={keyboardType} placeholderTextColor="#6e8291"/></View>;
const Button=({title,onPress,light=false})=><TouchableOpacity accessibilityRole="button" style={[s.button,light&&s.light]} onPress={onPress}><Text style={[s.buttonText,light&&{color:ink}]}>{title}</Text></TouchableOpacity>;
const Box=({title,children})=><View style={s.panel}><Text style={s.h2}>{title}</Text>{children}</View>;
export default function App(){
 const [tab,setTab]=useState('Steel BBS'),[diameter,setDiameter]=useState('16'),[count,setCount]=useState('10'),[segments,setSegments]=useState('6000'),[hooks,setHooks]=useState('0'),[hookLength,setHookLength]=useState('0'),[deduction,setDeduction]=useState('0');
 const [work,setWork]=useState('Concrete'),[length,setLength]=useState('5'),[width,setWidth]=useState('3'),[height,setHeight]=useState('0.2'),[nos,setNos]=useState('1'),[qDed,setQDed]=useState('0'),[project,setProject]=useState('My Project');
 const [result,setResult]=useState(null),[rows,setRows]=useState([]),[photo,setPhoto]=useState(null);
 const [user,setUser]=useState(null),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[accountBusy,setAccountBusy]=useState(false);
 const [asset,setAsset]=useState(null),[question,setQuestion]=useState('Calculate measurable concrete, formwork, steel and masonry quantities from this drawing.'),[knownDimension,setKnownDimension]=useState('');
 const [analysis,setAnalysis]=useState(null),[aiBusy,setAiBusy]=useState(false),[quota,setQuota]=useState(null),[packages,setPackages]=useState([]),[isPro,setIsPro]=useState(false),[ocrText,setOcrText]=useState(''),[ocrBusy,setOcrBusy]=useState(false);
 useEffect(()=>{
  if(!supabase)return;
  let mounted=true;
  supabase.auth.getUser().then(({data})=>{if(mounted)setUser(data.user||null)}).catch(()=>{});
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>{if(mounted)setUser(session?.user||null)});
  return ()=>{mounted=false;subscription.unsubscribe()};
 },[]);
 useEffect(()=>{
   if(!user || !hasBilling){setIsPro(false);setPackages([]);return;}
   let mounted=true;
   setupPurchases(user.id).then(()=>Promise.all([listPackages(),currentProEntitlement()])).then(([pk,pro])=>{
     if(mounted){setPackages(pk);setIsPro(pro);}
   }).catch(()=>{});
   return ()=>{mounted=false};
 },[user?.id]);
 const authenticate=async(signup=false)=>{
   if(!supabase){Alert.alert('AI setup pending','A verified Supabase project must be configured before account access can be enabled.');return;}
   setAccountBusy(true);
   try{
     const {data,error}=signup ? await supabase.auth.signUp({email:email.trim(),password}):await supabase.auth.signInWithPassword({email:email.trim(),password});
     if(error)throw error;
     if(signup && !data?.session)Alert.alert('Verify your email','Check your inbox for the confirmation email, then sign in.');
   }catch(e){Alert.alert('Account error',e.message||'Please check your details.');}
   finally{setAccountBusy(false);}
 };
 const signOut=async()=>{await supabase?.auth.signOut();setAnalysis(null);setIsPro(false);};
 const addAnalysisItem=item=>{
   if(typeof item.quantity!=='number'||!Number.isFinite(item.quantity)||item.quantity<0){Alert.alert('No measured quantity','This item cannot be added without verified dimensions.');return;}
   Alert.alert('Verify drawing measurements','AI results are preliminary and may be incorrect. Have you checked this item against approved drawings and site measurements?',[
      {text:'Cancel'},{text:'Add verified estimate',onPress:()=>persist([...rows,{id:String(Date.now()),description:item.item,quantity:item.quantity,unit:item.unit,notes:item.formula+' | '+item.evidence,source:'AI draft—user confirmed'}])}
   ]);
 };
 const scanOffline=async()=>{
   if(!photo){Alert.alert('Photo required','Choose or capture a clear photograph of the drawing. Offline text recognition does not process PDFs yet.');return;}
   setOcrBusy(true);setOcrText('');
   try{
      const found=await recognizeText(photo);
      const text=String(found?.text||'');
      setOcrText(text || 'No legible text was detected. Retake the photo closer to the drawing.');
   }catch(e){Alert.alert('Offline recognition failed',e?.message||'The device could not read this photograph.');}
   finally{setOcrBusy(false);}
 };
 const analyze=async()=>{
   if(!user||!supabase){Alert.alert('Sign in required','An authenticated account is required for AI analysis.');return;}
   if(!asset?.base64){Alert.alert('Choose a drawing','Use the camera, gallery or PDF picker first.');return;}
   setAiBusy(true);setAnalysis(null);
   try{
     const {data,error}=await supabase.functions.invoke('analyze-drawing',{body:{
       requestId:Crypto.randomUUID(),mime:asset.mime,base64:asset.base64,question:question.trim(),
       knownDimension:knownDimension.trim()
     }});
     if(error)throw error;
     if(data?.error)throw new Error(data.error);
     setAnalysis(data.result);setQuota({tier:data.tier,remaining:data.remaining});
   }catch(e){Alert.alert('AI unavailable',e?.message||'AI service has not been deployed or the free-attempt limit was reached.');}
   finally{setAiBusy(false);}
 };
 const choosePdf=async()=>{
   try{
     const selection=await DocumentPicker.getDocumentAsync({type:'application/pdf',copyToCacheDirectory:true,multiple:false});
     if(selection.canceled)return;
     const file=selection.assets[0];
     if(file.size>5_500_000){Alert.alert('PDF too large','The initial upload limit is 5.5 MB.');return;}
     const data=await FileSystem.readAsStringAsync(file.uri,{encoding:FileSystem.EncodingType.Base64});
     setAsset({base64:data,mime:'application/pdf',name:file.name});setPhoto(null);
   }catch(e){Alert.alert('PDF error',e.message);}
 };
 const selectImage=(file)=>{
   if(!file.base64){Alert.alert('Image unavailable','Unable to load image bytes.');return;}
   setAsset({base64:file.base64,mime:file.mimeType||'image/jpeg',name:'Site photograph'});setPhoto(file.uri);
 };
 const buy=async(pkg)=>{
  if(!hasCloud||!user){Alert.alert('Account required','Sign in to a configured backend before purchasing.');return;}
  try{
    const purchased=await buyPackage(pkg);setIsPro(purchased);
    Alert.alert(purchased?'Purchase confirmed':'Purchase pending',purchased?'Pro access recognized on device; server access activates after verified store event.':'Check your Play Store purchase status.');
  }catch(e){Alert.alert('Purchase unavailable',e.message||'Store billing is not configured.');}
 };
 const restore=async()=>{try{setIsPro(await restorePurchases());Alert.alert('Restore completed','Your Play Store subscription status has been refreshed.');}catch(e){Alert.alert('Unable to restore',e.message)}};
 const deleteAccount=()=>Alert.alert('Delete account?','Your account and cloud AI history will be removed. Cancel any active store subscription separately. This cannot be reversed.',[
   {text:'Cancel'},
   {text:'Delete account',style:'destructive',onPress:async()=>{if(!supabase)return;const {error}=await supabase.functions.invoke('delete-account',{body:{confirm:true}});if(error)Alert.alert('Unable to delete','Account deletion is not yet configured.');else await signOut();}}
 ]);
 useEffect(()=>{AsyncStorage.getItem('cq-rows-v1').then(v=>{if(v){const parsed=JSON.parse(v);if(Array.isArray(parsed))setRows(parsed)}}).catch(()=>{});},[]);
 const persist=next=>{setRows(next);AsyncStorage.setItem('cq-rows-v1',JSON.stringify(next)).catch(()=>Alert.alert('Storage unavailable','Export your sheet immediately.'));};
 const calculateBbs=()=>{try{const q=barBbs({diameter,count,segments,hooks,hookLength,deduction});setResult({description:diameter+'mm reinforcement',...q,source:'Manual BBS'});}catch(e){Alert.alert('Check input',e.message)}};
 const calculateQ=()=>{try{const q=takeoff({type:work,length,width,height,count:nos,deduction:qDed});setResult({...q,source:'Manual takeoff'});}catch(e){Alert.alert('Check input',e.message)}};
 const capture=async()=>{const perm=await ImagePicker.requestCameraPermissionsAsync();if(!perm.granted){Alert.alert('Camera permission','Enable camera access in system settings.');return;}const res=await ImagePicker.launchCameraAsync({mediaTypes:['images'],quality:.55,base64:true});if(!res.canceled)selectImage(res.assets[0]);};
 const choose=async()=>{const res=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],quality:.55,base64:true});if(!res.canceled)selectImage(res.assets[0]);};
 const exportPdf=async()=>{if(!rows.length){Alert.alert('Empty sheet','Add at least one item first.');return;}const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const html='<html><body style="font-family:Arial"><h1>CivilQuant - Measurement Sheet</h1><h3>'+esc(project)+'</h3><table border="1" cellspacing="0" cellpadding="8"><tr><th>No</th><th>Item</th><th>Measurements</th><th>Quantity</th><th>Unit</th></tr>'+rows.map((r,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(r.description)+'</td><td>'+esc(r.notes)+'</td><td>'+round(r.quantity)+'</td><td>'+esc(r.unit)+'</td></tr>').join('')+'</table><p>Verify dimensions and specifications before construction or payment certification.</p></body></html>';try{const {uri}=await Print.printToFileAsync({html});await Sharing.shareAsync(uri,{mimeType:'application/pdf'});}catch(e){Alert.alert('Export failed',e.message)}};
 return <SafeAreaView style={s.root}><StatusBar backgroundColor={ink} barStyle="light-content"/><View style={s.header}><Text style={s.brand}>▦ CIVILQUANT</Text><Text style={s.subtitle}>Civil engineering estimates · AI integration preview</Text></View>
 <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{maxHeight:48,backgroundColor:'#e0ebed'}} contentContainerStyle={s.tabs}>{['Steel BBS','Takeoff','Sheets','AI Drawings','Pro'].map(x=><TouchableOpacity key={x} onPress={()=>{setTab(x);setResult(null)}} style={[s.tab,tab===x&&s.active]}><Text style={[s.tabText,tab===x&&{color:'#fff'}]}>{x}</Text></TouchableOpacity>)}</ScrollView>
 <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
 {tab==='Steel BBS'&&<Box title="Steel weight & cutting length"><View style={s.row}><Field label="Diameter (mm)" value={diameter} onChangeText={setDiameter}/><Field label="Number of bars" value={count} onChangeText={setCount}/></View><Field label="Centerline segments (mm, comma separated)" value={segments} onChangeText={setSegments} keyboardType="default"/><View style={s.row}><Field label="Hooks per bar" value={hooks} onChangeText={setHooks}/><Field label="Each hook (mm)" value={hookLength} onChangeText={setHookLength}/></View><Field label="Bend deduction per bar (mm)" value={deduction} onChangeText={setDeduction}/><Button title="Calculate steel" onPress={calculateBbs}/><Text style={s.hint}>Approximate bar weight: d²/162 kg/m. Bend allowances must be checked against your code and bar shape.</Text></Box>}
 {tab==='Takeoff'&&<Box title="Civil quantity takeoff"><Label>Work item (tap to choose)</Label><View style={s.chips}>{ITEMS.map(x=><TouchableOpacity key={x.name} onPress={()=>setWork(x.name)} style={[s.chip,work===x.name&&s.chosen]}><Text style={{color:work===x.name?'white':ink,fontSize:12}}>{x.name}</Text></TouchableOpacity>)}</View><View style={s.row}><Field label="Length (m)" value={length} onChangeText={setLength}/><Field label="Width (m)" value={width} onChangeText={setWidth}/></View><View style={s.row}><Field label="Height / depth (m)" value={height} onChangeText={setHeight}/><Field label="No. of items" value={nos} onChangeText={setNos}/></View><Field label="Deduction (area/volume)" value={qDed} onChangeText={setQDed}/><Button title="Calculate quantity" onPress={calculateQ}/></Box>}
 {result&&<Box title="Calculated result"><Text style={s.number}>{round(result.quantity,3)} {result.unit}</Text>{result.cutLengthMm&&<Text>Cutting length/bar: {round(result.cutLengthMm,1)} mm · Total length: {round(result.totalLengthM,3)} m</Text>}<Text style={s.hint}>{result.notes}</Text><Button title="+ Add to measurement sheet" onPress={()=>{persist([...rows,{id:Date.now().toString(),...result}]);setResult(null);Alert.alert('Saved','Entry added to measurement sheet.')}}/></Box>}
 {tab==='Sheets'&&<Box title="Measurement sheet"><Field label="Project title" value={project} onChangeText={setProject} keyboardType="default"/><Text style={s.hint}>{rows.length} item(s) saved locally on this device.</Text>{rows.map((r,i)=><View key={r.id+i} style={s.sheetItem}><Text style={{fontWeight:'bold',color:ink}}>{i+1}. {r.description}: {round(r.quantity,3)} {r.unit}</Text><Text style={s.hint}>{r.notes}</Text><Button title="Remove" light onPress={()=>persist(rows.filter((_,j)=>i!==j))}/></View>)}<Button title="Export measurement sheet to PDF" onPress={exportPdf}/><Button title="Clear measurement sheet" light onPress={()=>Alert.alert('Clear all entries?','This cannot be undone.',[{text:'Cancel'},{text:'Clear',style:'destructive',onPress:()=>persist([])}])}/></Box>}
 {tab==='AI Drawings'&&<Box title="AI drawing & photo analysis">
  <Text style={s.hint}>{hasCloud?'Cloud configured. Sign in to access server-controlled analysis limits.':'AI account connection pending. The secure backend must be deployed and configured before live analysis is available.'}</Text>
  {!user?<><Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address"/><Field label="Password (minimum 6 characters)" value={password} onChangeText={setPassword} keyboardType="default"/>
    <Button title={accountBusy?'Signing in...':'Sign in'} onPress={()=>authenticate(false)}/>
    <Button title="Create account" light onPress={()=>authenticate(true)}/></>
  :<><Text style={s.hint}>Signed in: {user.email}</Text><Button title="Sign out" light onPress={signOut}/></>}
  <Text style={s.hint}>3 free AI analyses per account, then a paid subscription is required. Only measured, legible and dimensioned drawings can produce defensible quantities.</Text>
  <Button title="Take drawing photo" onPress={capture}/>
  <Button title="Choose photo" light onPress={choose}/>
  <Button title="Choose PDF drawing" light onPress={choosePdf}/>
  <Button title={ocrBusy?'Scanning text...':'Read drawing text OFFLINE (free)'} light onPress={scanOffline}/>
  {!!ocrText&&<View style={s.sheetItem}><Text style={{fontWeight:'700',color:ink}}>Recognized labels/dimensions (unverified):</Text><Text selectable style={{color:ink,marginTop:8}}>{ocrText.slice(0,1800)}</Text>
  <Button title="Use scan as question context" light onPress={()=>setQuestion((question+'\nDetected drawing text (unverified): '+ocrText.slice(0,350)).slice(0,790))}/></View>}
  {asset&&<Text style={s.hint}>Selected: {asset.name} ({asset.mime})</Text>}
  {photo&&<Image source={{uri:photo}} resizeMode="contain" style={{width:'100%',height:230,borderRadius:10,marginTop:12}}/>}
  <Field label="Question for engineering AI" value={question} onChangeText={setQuestion} keyboardType="default"/>
  <Field label="Verified dimensions / drawing scale (optional)" value={knownDimension} onChangeText={setKnownDimension} keyboardType="default"/>
  <Button title={aiBusy?'Analyzing...':'Analyze drawing with AI'} onPress={analyze}/>
  {quota&&<Text style={s.hint}>Remaining {quota.tier} analyses: {quota.remaining}</Text>}
 </Box>}
 {tab==='AI Drawings'&&analysis&&<Box title="AI draft engineering report">
   <Text style={{color:ink}}>{analysis.summary}</Text>
   {(analysis.items||[]).map((item,i)=><View key={i} style={s.sheetItem}>
    <Text style={{fontWeight:'800',color:ink}}>{item.item} — {typeof item.quantity==='number'?round(item.quantity):'Unknown'} {item.unit}</Text>
    <Text style={s.hint}>{item.formula}</Text><Text style={s.hint}>Evidence: {item.evidence}</Text>
    {item.needsVerification&&<Text style={s.hint}>⚠ Requires engineering verification</Text>}
    <Button title="Add verified estimate to sheet" light onPress={()=>addAnalysisItem(item)}/>
   </View>)}
   {(analysis.warnings||[]).map((w,i)=><Text key={i} style={s.hint}>• {w}</Text>)}
 </Box>}
 {tab==='Pro'&&<Box title="CivilQuant Pro — subscriptions">
   <Text style={s.number}>PKR 750 / month</Text>
   <Text style={s.hint}>Target price in Pakistan. The exact local currency price is determined by Google Play or Apple App Store at checkout, not converted by this app.</Text>
   <Text style={s.hint}>Includes 20 AI analyses each rolling 30-day window. Manual engineering calculators remain free.</Text>
   <Text style={s.hint}>Account: {user?.email||'Not signed in'} · Device Pro entitlement: {isPro?'Active':'Not active'}</Text>
   {!hasBilling&&<Text style={s.hint}>Store billing is not configured yet. No charges can be made from this build.</Text>}
   {packages.map((pkg,i)=><Button key={i} title={'Subscribe — '+pkg.product.priceString} onPress={()=>buy(pkg)}/>)}
   {hasBilling&&<Button title="Restore purchases" light onPress={restore}/>}
   <Button title="Manage subscriptions in store" light onPress={manageSubscription}/>
   {user&&<Button title="Delete my account" light onPress={deleteAccount}/>}
 </Box>}
 {tab==='AI'&&<AIAnalysis/>}
 <View style={s.warning}><Text style={{color:'#654e1b'}}>ENGINEERING NOTE: All quantities are estimates. Verify with drawings, site measurements, bar schedules and applicable engineering standards before construction or billing.</Text></View>
 </ScrollView><CivilQuantBanner isPro={isPro}/></SafeAreaView>;
}
const s=StyleSheet.create({root:{flex:1,backgroundColor:'#f3f7f8'},header:{padding:20,backgroundColor:ink},brand:{fontSize:24,fontWeight:'900',color:'white',letterSpacing:2},subtitle:{color:'#bcd5d7',marginTop:5},tabs:{flexDirection:'row',backgroundColor:'#e0ebed'},tab:{minWidth:90,paddingHorizontal:8,paddingVertical:14,alignItems:'center'},active:{backgroundColor:teal},tabText:{fontSize:12,fontWeight:'700',color:ink},scroll:{padding:16,paddingBottom:40},panel:{backgroundColor:'white',borderRadius:16,padding:18,marginBottom:16,borderColor:'#d9e8ea',borderWidth:1},h2:{fontSize:20,color:ink,fontWeight:'800',marginBottom:16},label:{color:'#455d6b',fontWeight:'700',marginBottom:6,fontSize:12},field:{borderWidth:1,borderColor:'#bdd0d4',padding:11,borderRadius:9,marginBottom:14,color:ink},row:{flexDirection:'row',gap:12},button:{backgroundColor:teal,padding:13,borderRadius:9,marginTop:9,alignItems:'center'},light:{backgroundColor:'#e4f3f0'},buttonText:{color:'white',fontWeight:'800'},number:{fontSize:29,fontWeight:'900',color:teal,marginBottom:8},hint:{fontSize:12,color:'#587282',lineHeight:19,marginTop:10},chips:{flexDirection:'row',flexWrap:'wrap',gap:7,marginBottom:16},chip:{padding:8,borderRadius:9,backgroundColor:'#eaf4f4'},chosen:{backgroundColor:teal},sheetItem:{marginTop:14,borderBottomWidth:1,borderColor:'#ddd',paddingBottom:12},warning:{backgroundColor:'#fff5d9',padding:15,borderRadius:12}});
