import 'react-native-url-polyfill/auto';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';

// Publishable key only. NEVER place a service-role key or AI provider key here.
export const supabase = createClient(
  'https://mqjgaocidxcghhfiyvxx.supabase.co',
  'sb_publishable_tUbRckm-scRWBcXpjO0j_w_XgzENoUW',
  {auth: {
    ...(Platform.OS !== 'web' ? {storage:AsyncStorage} : {}),
    autoRefreshToken:true,
    persistSession:true,
    detectSessionInUrl:false,
    lock:processLock
  }}
);
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', state => {
    if(state==='active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
