/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variable extraction with browser safe fallbacks
const supabaseUrl = 
  import.meta.env.VITE_SUPABASE_URL ||
  (typeof process !== 'undefined' && (process.env?.VITE_SUPABASE_URL || process.env?.SUPABASE_URL)) ||
  (typeof window !== 'undefined' ? localStorage.getItem('sma_supabase_url') : null) ||
  'https://gwda-school-kambia1.supabase.co';

const supabaseAnonKey = 
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  (typeof process !== 'undefined' && (process.env?.VITE_SUPABASE_ANON_KEY || process.env?.SUPABASE_ANON_KEY)) ||
  (typeof window !== 'undefined' ? localStorage.getItem('sma_supabase_anon_key') : null) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZWZlcmVuY2UiOiJnd2RhLXNjaG9vbC1rYW1iaWExIn0.pre-generated-key';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.info(
    '[SupabaseClient] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set in environment. Using pre-configured project credentials or localStorage.'
  );
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'sma_supabase_auth_token',
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

export default supabase;
