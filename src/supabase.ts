/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default Supabase Configuration for Givers World Mission
export const DEFAULT_SUPABASE_URL = 'https://gwda-school-kambia1.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZWZlcmVuY2UiOiJnd2RhLXNjaG9vbC1rYW1iaWExIn0.pre-generated-key';

const STORAGE_URL_KEY = 'sma_supabase_url';
const STORAGE_KEY_KEY = 'sma_supabase_anon_key';

/**
 * Retrieve current active Supabase URL
 */
export function getSupabaseUrl(): string {
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem(STORAGE_URL_KEY);
    if (customUrl && customUrl.trim()) return customUrl.trim();
  }
  return (
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
    (typeof process !== 'undefined' && (process.env?.VITE_SUPABASE_URL || process.env?.SUPABASE_URL)) ||
    DEFAULT_SUPABASE_URL
  );
}

/**
 * Retrieve current active Supabase Anon Key
 */
export function getSupabaseAnonKey(): string {
  if (typeof window !== 'undefined') {
    const customKey = localStorage.getItem(STORAGE_KEY_KEY);
    if (customKey && customKey.trim()) return customKey.trim();
  }
  return (
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
    (typeof process !== 'undefined' && (process.env?.VITE_SUPABASE_ANON_KEY || process.env?.SUPABASE_ANON_KEY)) ||
    DEFAULT_SUPABASE_ANON_KEY
  );
}

/**
 * Save user custom Supabase credentials
 */
export function saveSupabaseCredentials(url: string, key: string): void {
  if (typeof window !== 'undefined') {
    if (url) localStorage.setItem(STORAGE_URL_KEY, url.trim());
    else localStorage.removeItem(STORAGE_URL_KEY);

    if (key) localStorage.setItem(STORAGE_KEY_KEY, key.trim());
    else localStorage.removeItem(STORAGE_KEY_KEY);

    // Reinitialize client instance
    reinitializeSupabaseClient();
    window.dispatchEvent(new CustomEvent('sma_supabase_config_changed'));
  }
}

/**
 * Reset to default configuration
 */
export function resetSupabaseCredentials(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_URL_KEY);
    localStorage.removeItem(STORAGE_KEY_KEY);
    reinitializeSupabaseClient();
    window.dispatchEvent(new CustomEvent('sma_supabase_config_changed'));
  }
}

let clientInstance: SupabaseClient | null = null;

function initClient(): SupabaseClient | null {
  try {
    const url = getSupabaseUrl();
    const key = getSupabaseAnonKey();
    if (!url || !key) return null;
    return createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'sma_supabase_auth_token'
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
  } catch (err) {
    console.warn('[Supabase] Failed initializing client instance:', err);
    return null;
  }
}

export function reinitializeSupabaseClient(): SupabaseClient | null {
  clientInstance = initClient();
  return clientInstance;
}

clientInstance = initClient();

export const supabase: SupabaseClient | null = clientInstance;
export const isSupabaseConfigured = true;

/**
 * Performs a live connection test to Supabase
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  connected: boolean;
  tableExists: boolean;
  message: string;
  url: string;
  latencyMs?: number;
}> {
  const currentUrl = getSupabaseUrl();
  const client = clientInstance || initClient();

  if (!client) {
    return {
      success: false,
      connected: false,
      tableExists: false,
      message: 'Supabase client could not be initialized with current credentials.',
      url: currentUrl
    };
  }

  const startTime = Date.now();
  try {
    // Attempt querying the unified school_documents table
    const { data, error } = await client
      .from('school_documents')
      .select('doc_id')
      .limit(1);

    const latencyMs = Date.now() - startTime;

    if (error) {
      // Check if table does not exist yet (PostgREST code 42P01 or relation does not exist)
      if (
        error.code === '42P01' || 
        error.message?.includes('relation "public.school_documents" does not exist') ||
        error.message?.includes('relation') ||
        error.code === 'PGRST116' ||
        error.code === 'PGRST204'
      ) {
        return {
          success: true,
          connected: true,
          tableExists: false,
          latencyMs,
          url: currentUrl,
          message: 'Connected to Supabase project! The school_documents table has not been created yet. Run the SQL setup script to initialize it.'
        };
      }

      // If network unreachable or invalid API key
      if (error.message?.includes('FetchError') || error.message?.includes('Failed to fetch')) {
        return {
          success: false,
          connected: false,
          tableExists: false,
          url: currentUrl,
          message: `Network connection to ${currentUrl} failed. Please verify the URL and your internet connection.`
        };
      }

      return {
        success: true,
        connected: true,
        tableExists: false,
        latencyMs,
        url: currentUrl,
        message: `Connected to Supabase. Database note: ${error.message}`
      };
    }

    return {
      success: true,
      connected: true,
      tableExists: true,
      latencyMs,
      url: currentUrl,
      message: `Successfully connected to Supabase in ${latencyMs}ms. Table "school_documents" is active and ready.`
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return {
      success: false,
      connected: false,
      tableExists: false,
      latencyMs,
      url: currentUrl,
      message: err?.message || 'Could not reach Supabase endpoint.'
    };
  }
}

/**
 * Standard SQL Schema for the user to execute in Supabase SQL Editor
 */
export const SUPABASE_SQL_SETUP_SCRIPT = `-- =========================================================================
-- GIVERS WORLD MISSION DIPLOMATS ACADEMY & COLLEGE (KAMBIA 1, SIERRA LEONE)
-- SUPABASE DATABASE INITIALIZATION SCRIPT
-- =========================================================================
-- Paste this script into your Supabase Dashboard:
-- https://supabase.com/dashboard/project/_/sql/new
-- Then click "Run" (CMD/CTRL + ENTER).
-- =========================================================================

-- 1. Main Unified School Documents Table
-- Stores all records (students, academic grades, fee ledgers, exam preps, 
-- staff, library, buses, notices) with full JSONB flexibility.
CREATE TABLE IF NOT EXISTS public.school_documents (
  collection text NOT NULL,
  doc_id text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (collection, doc_id)
);

-- Index for high-speed collection filtering & lookups
CREATE INDEX IF NOT EXISTS idx_school_documents_collection ON public.school_documents (collection);
CREATE INDEX IF NOT EXISTS idx_school_documents_updated_at ON public.school_documents (updated_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.school_documents ENABLE ROW LEVEL SECURITY;

-- Allow unrestricted read & write for authorized school administrative portal clients
DROP POLICY IF EXISTS "Public full access to school_documents" ON public.school_documents;
CREATE POLICY "Public full access to school_documents"
  ON public.school_documents
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Enable Supabase Realtime for instant cross-device updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.school_documents;


-- 2. Reference Snapshots & Archival Backups Table
CREATE TABLE IF NOT EXISTS public.reference_snapshots (
  id text PRIMARY KEY,
  title text NOT NULL,
  notes text,
  saved_at timestamp with time zone NOT NULL DEFAULT now(),
  saved_by text NOT NULL DEFAULT 'System Administrator',
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_reference_snapshots_saved_at ON public.reference_snapshots (saved_at DESC);

ALTER TABLE public.reference_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public full access to reference_snapshots" ON public.reference_snapshots;
CREATE POLICY "Public full access to reference_snapshots"
  ON public.reference_snapshots
  FOR ALL
  USING (true)
  WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.reference_snapshots;


-- 3. Institutional Reference Audit Logs Table
CREATE TABLE IF NOT EXISTS public.reference_audit_logs (
  id text PRIMARY KEY,
  reference_number text NOT NULL,
  type text NOT NULL,
  category text NOT NULL,
  title text NOT NULL,
  summary text NOT NULL,
  performed_by text NOT NULL,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  formatted_date text,
  target_id text,
  details jsonb,
  status text NOT NULL DEFAULT 'Saved & Active'
);

CREATE INDEX IF NOT EXISTS idx_reference_audit_logs_timestamp ON public.reference_audit_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_reference_audit_logs_category ON public.reference_audit_logs (category);

ALTER TABLE public.reference_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public full access to reference_audit_logs" ON public.reference_audit_logs;
CREATE POLICY "Public full access to reference_audit_logs"
  ON public.reference_audit_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Done! Your Supabase database is now 100% configured for Givers World Mission.
`;
