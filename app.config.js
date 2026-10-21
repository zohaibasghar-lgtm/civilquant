// CivilQuant dynamic Expo config. Only public/non-secret IDs can be in the app.
const base = require('./app.json').expo;
module.exports = {expo:{
 ...base,
 version:'1.1.0',
 android:{...base.android,versionCode:2},
 plugins:[
  ...base.plugins,
  ['react-native-google-mobile-ads',{
   androidAppId:process.env.ADMOB_ANDROID_APP_ID || 'ca-app-pub-3940256099942544~3347511713',
   iosAppId:process.env.ADMOB_IOS_APP_ID || 'ca-app-pub-3940256099942544~1458002511'
  }]
 ]
}};
