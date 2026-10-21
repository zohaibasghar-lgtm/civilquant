import 'react-native-url-polyfill/auto';
import {createClient} from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
export const hasCloud = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(SUPABASE_URL) && SUPABASE_ANON_KEY.length>30;
export const supabase=hasCloud ? createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{
 auth:{storage:AsyncStorage,autoRefreshToken:true,persistSession:true,detectSessionInUrl:false}
}):null;
