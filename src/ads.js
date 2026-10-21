import React,{useEffect,useState} from 'react';
import {Platform,View,Text} from 'react-native';
import mobileAds,{AdsConsent,BannerAd,BannerAdSize,TestIds} from 'react-native-google-mobile-ads';

const banner=process.env.EXPO_PUBLIC_ADMOB_BANNER_ID || '';
const live=process.env.EXPO_PUBLIC_REAL_ADS==='true' && /^ca-app-pub-\d{16}\/\d{10}$/.test(banner);
export function CivilQuantBanner({isPro=false}){
 const [canShow,setCanShow]=useState(false);
 useEffect(()=>{
  if(isPro)return;
  let active=true;
  (async()=>{
   try{
    await AdsConsent.requestInfoUpdate();
    const info=await AdsConsent.loadAndShowConsentFormIfRequired();
    if(!info.canRequestAds)return;
    await mobileAds().initialize();
    if(active)setCanShow(true);
   }catch(err){console.warn('Ad consent unavailable. Ads suppressed.');}
  })();
  return ()=>{active=false};
 },[isPro]);
 if(!canShow || isPro)return null;
 return <View style={{alignItems:'center',paddingVertical:6}}>
  {!live&&<Text style={{fontSize:10,color:'#687c86'}}>TEST AD — NOT MONETIZED</Text>}
  <BannerAd unitId={live?banner:TestIds.BANNER} size={BannerAdSize.BANNER}
    requestOptions={{requestNonPersonalizedAdsOnly:!live}}/>
 </View>;
}
