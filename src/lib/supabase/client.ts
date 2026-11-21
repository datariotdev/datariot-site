import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';

const DEFAULT_SUPABASE_URL = 'https://uycrtobdewnscwazshcu.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5Y3J0b2JkZXduc2N3YXpzaGN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NzU1NjYsImV4cCI6MjA3NTI1MTU2Nn0.EsZQOIE879QwU_FKk0Agh-yJBdRJcLTmYi-DCMjYaxU';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
        'Warning: Missing Supabase environment variables. Features requiring backend will not work.'
    );
}

// Only create the real client if variables exist, otherwise create a dummy
export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            storage: AsyncStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
        },
    })
    : (null as any); // Type cast to any to avoid widespread type errors, 
// but actual calls will need to check if supabase exists or it will error later, 
// which is still better than crashing on import.
