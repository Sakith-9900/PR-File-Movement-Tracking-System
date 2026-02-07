// Old Base 44 import
// import { createClient } from '@base44/sdk';
// import { appParams } from '@/lib/app-params';

// New Supabase import
import { supabaseClient } from './supabaseClient';

// Export supabase client with same name for minimal code changes
export const base44 = supabaseClient;
