/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * ============================================================================
 * FIRESTORE TO SUPABASE TRANSITION GUIDE & MIGRATION HELPER
 * ============================================================================
 * This module provides step-by-step guidance and programmatic migration utilities
 * to transition the Givers World Mission Student Management System from
 * Google Cloud Firestore to Supabase (PostgreSQL).
 *
 * TABLE OF CONTENTS:
 * 1. Conceptual Mapping (Firestore vs. Supabase)
 * 2. API Conversion Cheat Sheet
 * 3. PostgreSQL SQL Setup for Supabase
 * 4. Automated Data Migration Functions
 * 5. Verification & Health Checks
 * ============================================================================
 */

import { supabase } from './supabaseClient';

/**
 * ----------------------------------------------------------------------------
 * 1. CONCEPTUAL MAPPING
 * ----------------------------------------------------------------------------
 * | Firestore Concept           | Supabase Equivalent                         |
 * |-----------------------------|---------------------------------------------|
 * | Collection                  | PostgreSQL Table OR 'collection' partition  |
 * | Document                    | Table Row (or JSONB data field)             |
 * | Document ID                 | Primary Key (doc_id or id UUID/Text)        |
 * | Nested Objects (Maps)       | JSONB column (e.g. data jsonb)              |
 * | onSnapshot() Realtime       | supabase.channel().on('postgres_changes')   |
 * | Firestore Rules             | PostgreSQL Row Level Security (RLS) Policies|
 * | Firebase Auth (Google)      | Supabase Auth (OAuth & Email/Password)      |
 * ----------------------------------------------------------------------------
 */

/**
 * ----------------------------------------------------------------------------
 * 2. API CONVERSION CHEAT SHEET
 * ----------------------------------------------------------------------------
 *
 * FIRESTORE:
 *   await setDoc(doc(db, 'students', studentId), studentData, { merge: true });
 *
 * SUPABASE:
 *   await supabase.from('school_documents').upsert({
 *     collection: 'students',
 *     doc_id: studentId,
 *     data: studentData,
 *     updated_at: new Date().toISOString()
 *   }, { onConflict: 'collection,doc_id' });
 *
 * FIRESTORE QUERY:
 *   const snap = await getDocs(collection(db, 'students'));
 *   const students = snap.docs.map(d => ({ id: d.id, ...d.data() }));
 *
 * SUPABASE QUERY:
 *   const { data } = await supabase
 *     .from('school_documents')
 *     .select('doc_id, data')
 *     .eq('collection', 'students');
 *   const students = data.map(row => ({ id: row.doc_id, ...row.data }));
 *
 * FIRESTORE REALTIME:
 *   const unsub = onSnapshot(collection(db, 'students'), (snap) => { ... });
 *
 * SUPABASE REALTIME:
 *   const channel = supabase.channel('students_live')
 *     .on('postgres_changes', {
 *       event: '*',
 *       schema: 'public',
 *       table: 'school_documents',
 *       filter: 'collection=eq.students'
 *     }, (payload) => { ... })
 *     .subscribe();
 */

/**
 * ----------------------------------------------------------------------------
 * 3. RECOMMENDED SUPABASE POSTGRESQL SCHEMA
 * ----------------------------------------------------------------------------
 * Execute this SQL in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
 */
export const SUPABASE_MIGRATION_SQL = `
-- 1. Main Document Store for All Collections
CREATE TABLE IF NOT EXISTS public.school_documents (
  collection text NOT NULL,
  doc_id text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (collection, doc_id)
);

CREATE INDEX IF NOT EXISTS idx_school_documents_collection ON public.school_documents (collection);
CREATE INDEX IF NOT EXISTS idx_school_documents_updated_at ON public.school_documents (updated_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.school_documents ENABLE ROW LEVEL SECURITY;

-- Allow read/write for all users (or adjust according to institutional RBAC)
DROP POLICY IF EXISTS "Public full access to school_documents" ON public.school_documents;
CREATE POLICY "Public full access to school_documents"
  ON public.school_documents FOR ALL
  USING (true)
  WITH CHECK (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.school_documents;

-- 2. Snapshots Archive Table for Cloud Backups
CREATE TABLE IF NOT EXISTS public.reference_snapshots (
  id text PRIMARY KEY,
  title text NOT NULL,
  notes text,
  saved_at timestamp with time zone NOT NULL DEFAULT now(),
  saved_by text NOT NULL DEFAULT 'Super Administrator',
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.reference_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access to reference_snapshots" ON public.reference_snapshots;
CREATE POLICY "Public full access to reference_snapshots"
  ON public.reference_snapshots FOR ALL
  USING (true)
  WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.reference_snapshots;
`;

export interface MigrationStatus {
  collection: string;
  count: number;
  success: boolean;
  error?: string;
}

/**
 * ----------------------------------------------------------------------------
 * 4. AUTOMATED DATA MIGRATION FUNCTIONS
 * ----------------------------------------------------------------------------
 * Migrates local cache / historical Firestore records to Supabase.
 */
export async function migrateLocalCacheToSupabase(): Promise<{
  success: boolean;
  totalRecordsMigrated: number;
  results: MigrationStatus[];
}> {
  const collectionsToMigrate = [
    { name: 'students', storageKey: 'sma_students', idKey: 'id' },
    { name: 'academic_records', storageKey: 'sma_academic_records', idKey: 'studentId' },
    { name: 'fee_ledgers', storageKey: 'sma_fee_ledgers', idKey: 'studentId' },
    { name: 'exam_preps', storageKey: 'sma_exam_preps', idKey: 'studentId' },
    { name: 'teachers', storageKey: 'sma_teachers', idKey: 'id' },
    { name: 'library_books', storageKey: 'sma_library_books', idKey: 'id' },
    { name: 'library_checkouts', storageKey: 'sma_library_checkouts', idKey: 'id' },
    { name: 'buses', storageKey: 'sma_buses', idKey: 'id' },
    { name: 'class_notices', storageKey: 'sma_class_notices', idKey: 'id' },
    { name: 'daily_attendance', storageKey: 'sma_daily_attendance', idKey: 'id' },
    { name: 'incidents', storageKey: 'sma_disciplinary_incidents', idKey: 'id' },
  ];

  const results: MigrationStatus[] = [];
  let totalRecords = 0;

  for (const col of collectionsToMigrate) {
    try {
      const raw = localStorage.getItem(col.storageKey);
      if (!raw) {
        results.push({ collection: col.name, count: 0, success: true });
        continue;
      }

      const items = JSON.parse(raw);
      if (!Array.isArray(items) || items.length === 0) {
        results.push({ collection: col.name, count: 0, success: true });
        continue;
      }

      const rows = items.map((item: any) => {
        const docId = String(item[col.idKey] || item.id || item.studentId || `doc_${Date.now()}`);
        return {
          collection: col.name,
          doc_id: docId,
          data: item,
          updated_at: new Date().toISOString(),
        };
      });

      const { error } = await supabase
        .from('school_documents')
        .upsert(rows, { onConflict: 'collection,doc_id' });

      if (error) {
        results.push({
          collection: col.name,
          count: items.length,
          success: false,
          error: error.message,
        });
      } else {
        totalRecords += items.length;
        results.push({ collection: col.name, count: items.length, success: true });
      }
    } catch (err: any) {
      results.push({
        collection: col.name,
        count: 0,
        success: false,
        error: err?.message || 'Parse or upload error',
      });
    }
  }

  const allSuccess = results.every((r) => r.success);
  return {
    success: allSuccess,
    totalRecordsMigrated: totalRecords,
    results,
  };
}

/**
 * ----------------------------------------------------------------------------
 * 5. VERIFICATION & HEALTH CHECK
 * ----------------------------------------------------------------------------
 */
export async function verifySupabaseMigrationHealth(): Promise<{
  connected: boolean;
  schoolDocumentsTableExists: boolean;
  snapshotsTableExists: boolean;
  totalDocuments: number;
  message: string;
}> {
  try {
    const { count, error } = await supabase
      .from('school_documents')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return {
        connected: true,
        schoolDocumentsTableExists: false,
        snapshotsTableExists: false,
        totalDocuments: 0,
        message: `Connected to Supabase, but "school_documents" table is not found. Error: ${error.message}. Please run the SUPABASE_MIGRATION_SQL script in the Supabase SQL editor.`,
      };
    }

    // Check snapshots table
    const { error: snapError } = await supabase
      .from('reference_snapshots')
      .select('id')
      .limit(1);

    return {
      connected: true,
      schoolDocumentsTableExists: true,
      snapshotsTableExists: !snapError,
      totalDocuments: count || 0,
      message: `Supabase database is healthy and ready. Found ${count || 0} active school documents in PostgreSQL!`,
    };
  } catch (err: any) {
    return {
      connected: false,
      schoolDocumentsTableExists: false,
      snapshotsTableExists: false,
      totalDocuments: 0,
      message: `Connection failed: ${err?.message || 'Check network / VITE_SUPABASE_URL'}`,
    };
  }
}
