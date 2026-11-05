/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Bridges all historical Firestore calls directly to the active Supabase Database engine.
 * This guarantees zero regressions for existing components while ensuring all persistence
 * is powered directly by Supabase.
 */

import {
  cleanDocId,
  compressImageBase64,
  sanitizeForSupabase,
  syncSupabaseCollection,
  saveToSupabase,
  deleteFromSupabase,
  batchSaveToSupabase,
  clearSupabaseCollection,
  clearAllSupabaseSchoolData,
  checkSupabaseSyncStatus,
  saveAllSchoolRecordsToSupabase,
  createSupabaseSnapshot,
  fetchSupabaseSnapshots,
  deleteSupabaseSnapshot,
  ReferenceSnapshot
} from './supabaseSync';

export {
  cleanDocId,
  compressImageBase64,
  sanitizeForSupabase,
  syncSupabaseCollection,
  saveToSupabase,
  deleteFromSupabase,
  batchSaveToSupabase,
  clearSupabaseCollection,
  clearAllSupabaseSchoolData,
  checkSupabaseSyncStatus,
  saveAllSchoolRecordsToSupabase,
  createSupabaseSnapshot,
  fetchSupabaseSnapshots,
  deleteSupabaseSnapshot,
};

export type { ReferenceSnapshot };

// Aliases matching earlier method names so existing components seamlessly write to Supabase
export const sanitizeForFirestore = sanitizeForSupabase;
export const syncFirestoreCollection = syncSupabaseCollection;
export const saveToFirestore = saveToSupabase;
export const deleteFromFirestore = deleteFromSupabase;
export const batchSaveToFirestore = batchSaveToSupabase;
export const clearFirestoreCollection = clearSupabaseCollection;
export const clearAllFirestoreSchoolData = clearAllSupabaseSchoolData;
export const checkFirestoreSyncStatus = checkSupabaseSyncStatus;
export const saveAllSchoolRecordsToFirestore = saveAllSchoolRecordsToSupabase;
export const createReferenceSnapshot = createSupabaseSnapshot;
export const fetchReferenceSnapshots = fetchSupabaseSnapshots;
export const deleteReferenceSnapshot = deleteSupabaseSnapshot;
