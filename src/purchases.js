import Purchases from 'react-native-purchases';
import {Platform,Linking} from 'react-native';

const androidKey=process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '';
const iosKey=process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '';
export const hasBilling=Platform.OS==='android'?!!androidKey:!!iosKey;
let didConfigure=false;
export async function setupPurchases(userId){
 if(!hasBilling || !userId)return false;
 if(!didConfigure){
   Purchases.configure({apiKey:Platform.OS==='android'?androidKey:iosKey,appUserID:userId});
   didConfigure=true;
 } else {
   await Purchases.logIn(userId);
 }
 return true;
}
export async function listPackages(){
 if(!hasBilling)return [];
 const offers=await Purchases.getOfferings();
 return offers.current?.availablePackages || [];
}
export async function buyPackage(pack){
 const {customerInfo}=await Purchases.purchasePackage(pack);
 return !!customerInfo.entitlements.active['civilquant_pro'];
}
export async function restorePurchases(){
 const info=await Purchases.restorePurchases();
 return !!info.entitlements.active['civilquant_pro'];
}
export async function currentProEntitlement(){
 if(!hasBilling)return false;
 const info=await Purchases.getCustomerInfo();
 return !!info.entitlements.active['civilquant_pro'];
}
export const manageSubscription=()=>Linking.openURL(Platform.OS==='android'
 ?'https://play.google.com/store/account/subscriptions'
 :'https://apps.apple.com/account/subscriptions');
