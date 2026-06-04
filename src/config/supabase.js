import { createClient } from '@supabase/supabase-js';

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
if (!supabaseUrl.startsWith('http')) {
    supabaseUrl = 'https://placeholder.supabase.co';
}
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

if (!import.meta.env.VITE_SUPABASE_URL) {
    console.error('Missing Supabase environment variables - UI will load but data fetching will fail');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
