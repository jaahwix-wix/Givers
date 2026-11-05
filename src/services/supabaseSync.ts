/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, testSupabaseConnection } from '../supabase';

/**
 * Normalizes document IDs to ensure they are safe for database keys.
 */
export function cleanDocId(id: string): string {
  if (!id) return `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  return String(id).replace(/[\/\s#\?\[\]]+/g, '_');
}

/**
 * Compresses an image base64 data URL to keep database storage lightweight.
 */
export async function compressImageBase64(
  dataUrl: string, 
  maxDim = 320, 
  quality = 0.75
): Promise<string> {
  if (typeof window === 'undefined' || !dataUrl || !dataUrl.startsWith('data:image')) {
    return dataUrl;
  }
  if (dataUrl.length < 120000) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    } catch {
      resolve(dataUrl);
    }
  });
}

/**
 * Sanitizes object payload before saving to Supabase
 */
export function sanitizeForSupabase<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForSupabase) as unknown as T;
  }
  if (typeof obj === 'object') {
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        clean[key] = sanitizeForSupabase(value);
      }
    }
    return clean as T;
  }
  return obj;
}

export const LIVE_MODE_STORAGE_KEY = 'sma_live_production_active';

/**
 * Checks whether the application is running in Live Production Mode.
 * Default is TRUE for live production deployments.
 */
export function isLiveProductionMode(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(LIVE_MODE_STORAGE_KEY) !== 'false';
}

export function setLiveProductionMode(isLive: boolean): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LIVE_MODE_STORAGE_KEY, isLive ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('sma_live_mode_changed', { detail: { isLive } }));
  }
}

/**
 * Synchronizes a collection in real time with Supabase and localStorage.
 */
export function syncSupabaseCollection<T extends { id?: string; studentId?: string }>(
  collectionName: string,
  localStorageKey: string,
  onData: (items: T[]) => void,
  fallbackInitialData: T[] = []
): () => void {
  // 1. Immediately read from localStorage cache for instant zero-latency UI display
  try {
    const cached = localStorage.getItem(localStorageKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        onData(parsed);
      } else {
        onData([]);
      }
    } else {
      onData([]);
    }
  } catch (err) {
    onData([]);
  }

  let isSubscribed = true;

  // 2. Fetch latest data from Supabase
  const loadRemoteData = async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('school_documents')
        .select('doc_id, data')
        .eq('collection', collectionName);

      if (!isSubscribed) return;

      if (!error && Array.isArray(data) && data.length > 0) {
        const items: T[] = data.map(row => {
          const item = row.data as T;
          if (!item.id && row.doc_id) {
            (item as any).id = row.doc_id;
          }
          if (!item.studentId && row.doc_id) {
            (item as any).studentId = row.doc_id;
          }
          return item;
        });

        onData(items);
        try {
          localStorage.setItem(localStorageKey, JSON.stringify(items));
        } catch (e) {
          console.warn(`[SupabaseSync] Failed updating local storage for ${collectionName}:`, e);
        }
      } else if (!error && Array.isArray(data) && data.length === 0) {
        // Remote table is empty.
        // In live production mode, NEVER auto-seed mock or sample data!
        // The database remains pristine and ready for live user input.
        if (isLiveProductionMode()) {
          onData([]);
          try {
            localStorage.setItem(localStorageKey, JSON.stringify([]));
          } catch {}
          return;
        }

        // Only in staging / demo sandbox if explicitly requested:
        if (fallbackInitialData.length > 0) {
          batchSaveToSupabase(collectionName, fallbackInitialData);
          onData(fallbackInitialData);
          try {
            localStorage.setItem(localStorageKey, JSON.stringify(fallbackInitialData));
          } catch {}
        } else {
          onData([]);
        }
      }
    } catch (err) {
      console.warn(`[SupabaseSync] Query failed for ${collectionName}:`, err);
    }
  };

  loadRemoteData();

  // 3. Attach Supabase Realtime channel for live multi-user synchronization
  let channel: any = null;
  try {
    if (supabase) {
      const channelId = `sync_${collectionName}_${Date.now()}`;
      channel = supabase
        .channel(channelId)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'school_documents',
            filter: `collection=eq.${collectionName}`
          },
          () => {
            // Reload remote data when changes arrive from any user/session
            loadRemoteData();
          }
        )
        .subscribe();
    }
  } catch (err) {
    console.warn(`[SupabaseSync] Realtime subscribe error for ${collectionName}:`, err);
  }

  // 4. Return cleanup function
  return () => {
    isSubscribed = false;
    if (channel && supabase) {
      supabase.removeChannel(channel).catch(() => {});
    }
  };
}

/**
 * Saves a single document to Supabase and updates local cache.
 */
export async function saveToSupabase<T extends Record<string, any>>(
  collectionName: string,
  docId: string,
  data: T
): Promise<boolean> {
  const safeDocId = cleanDocId(docId);
  try {
    const payload: Record<string, any> = { ...data };
    if (typeof payload.profileImage === 'string' && payload.profileImage.startsWith('data:image')) {
      payload.profileImage = await compressImageBase64(payload.profileImage, 320, 0.75);
    }

    const sanitized = sanitizeForSupabase(payload);

    if (supabase) {
      const { error } = await supabase
        .from('school_documents')
        .upsert({
          collection: collectionName,
          doc_id: safeDocId,
          data: sanitized,
          updated_at: new Date().toISOString()
        }, { onConflict: 'collection,doc_id' });

      if (error) {
        console.warn(`[SupabaseSync] Upsert error for ${collectionName}/${safeDocId}:`, error.message);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sma_supabase_saved', { 
        detail: { collection: collectionName, id: safeDocId } 
      }));
    }
    return true;
  } catch (error) {
    console.error(`[SupabaseSync] Failed saving document ${safeDocId} to ${collectionName}:`, error);
    return false;
  }
}

/**
 * Deletes a single document from Supabase.
 */
export async function deleteFromSupabase(
  collectionName: string,
  docId: string
): Promise<boolean> {
  const safeDocId = cleanDocId(docId);
  try {
    if (supabase) {
      await supabase
        .from('school_documents')
        .delete()
        .eq('collection', collectionName)
        .eq('doc_id', safeDocId);
    }
    return true;
  } catch (error) {
    console.warn(`[SupabaseSync] Failed deleting document ${safeDocId} from ${collectionName}:`, error);
    return false;
  }
}

/**
 * Batch saves multiple documents to Supabase.
 */
export async function batchSaveToSupabase<T extends Record<string, any>>(
  collectionName: string,
  items: T[],
  idField: keyof T = 'id'
): Promise<boolean> {
  try {
    if (!supabase || items.length === 0) return true;

    const rows = await Promise.all(items.map(async (item) => {
      const rawId = String(item[idField] || (item as any).studentId || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
      const safeDocId = cleanDocId(rawId);

      const payload: Record<string, any> = { ...item };
      if (typeof payload.profileImage === 'string' && payload.profileImage.startsWith('data:image')) {
        payload.profileImage = await compressImageBase64(payload.profileImage, 320, 0.75);
      }

      return {
        collection: collectionName,
        doc_id: safeDocId,
        data: sanitizeForSupabase(payload),
        updated_at: new Date().toISOString()
      };
    }));

    const { error } = await supabase
      .from('school_documents')
      .upsert(rows, { onConflict: 'collection,doc_id' });

    if (error) {
      console.warn(`[SupabaseSync] Batch save warning for ${collectionName}:`, error.message);
    }
    return !error;
  } catch (error) {
    console.warn(`[SupabaseSync] Batch save failed for ${collectionName}:`, error);
    return false;
  }
}

/**
 * Purges all documents in a Supabase collection.
 */
export async function clearSupabaseCollection(collectionName: string): Promise<boolean> {
  try {
    if (supabase) {
      await supabase
        .from('school_documents')
        .delete()
        .eq('collection', collectionName);
    }
    return true;
  } catch (error) {
    console.warn(`[SupabaseSync] Clear collection failed for ${collectionName}:`, error);
    return false;
  }
}

/**
 * Completely purges ALL school operational collections from Supabase.
 */
export async function clearAllSupabaseSchoolData(): Promise<void> {
  try {
    if (supabase) {
      await supabase
        .from('school_documents')
        .delete()
        .neq('collection', '');
    }
  } catch (err) {
    console.warn('[SupabaseSync] Clear all collections note:', err);
  }
}

/**
 * Checks if Supabase backend is reachable and responsive.
 */
export async function checkSupabaseSyncStatus(): Promise<boolean> {
  const result = await testSupabaseConnection();
  return result.connected;
}

export interface ReferenceSnapshot {
  id: string;
  title: string;
  notes?: string;
  savedAt: string;
  savedBy: string;
  metrics: {
    studentsCount: number;
    recordsCount: number;
    feesCount: number;
    examPrepsCount: number;
    teachersCount: number;
    libraryCount: number;
    totalDue?: number;
    totalCollected?: number;
    totalOutstanding?: number;
  };
  payload: {
    students: any[];
    records: any[];
    examPreps: any[];
    fees: any[];
    teachers?: any[];
    books?: any[];
    buses?: any[];
    notices?: any[];
  };
}

/**
 * Saves all current school records to Supabase across all core collections.
 */
export async function saveAllSchoolRecordsToSupabase(data: {
  students: any[];
  records: any[];
  examPreps: any[];
  fees: any[];
  teachers?: any[];
  books?: any[];
  buses?: any[];
  notices?: any[];
}): Promise<{
  success: boolean;
  counts: {
    students: number;
    records: number;
    fees: number;
    examPreps: number;
    teachers: number;
    books: number;
    buses: number;
    notices: number;
  };
}> {
  const counts = {
    students: data.students?.length || 0,
    records: data.records?.length || 0,
    fees: data.fees?.length || 0,
    examPreps: data.examPreps?.length || 0,
    teachers: data.teachers?.length || 0,
    books: data.books?.length || 0,
    buses: data.buses?.length || 0,
    notices: data.notices?.length || 0,
  };

  try {
    if (data.students && data.students.length > 0) {
      await batchSaveToSupabase('students', data.students, 'id');
    }
    if (data.records && data.records.length > 0) {
      await batchSaveToSupabase('academic_records', data.records, 'studentId');
    }
    if (data.fees && data.fees.length > 0) {
      await batchSaveToSupabase('fee_ledgers', data.fees, 'studentId');
    }
    if (data.examPreps && data.examPreps.length > 0) {
      await batchSaveToSupabase('exam_preps', data.examPreps, 'studentId');
    }
    if (data.teachers && data.teachers.length > 0) {
      await batchSaveToSupabase('teachers', data.teachers, 'id');
    }
    if (data.books && data.books.length > 0) {
      await batchSaveToSupabase('library_books', data.books, 'id');
    }
    if (data.buses && data.buses.length > 0) {
      await batchSaveToSupabase('buses', data.buses, 'id');
    }
    if (data.notices && data.notices.length > 0) {
      await batchSaveToSupabase('class_notices', data.notices, 'id');
    }

    return { success: true, counts };
  } catch (error) {
    console.error('[SupabaseSync] saveAllSchoolRecordsToSupabase failed:', error);
    return { success: false, counts };
  }
}

/**
 * Creates an immutable point-in-time Snapshot in Supabase
 */
export async function createSupabaseSnapshot(
  title: string,
  notes: string = '',
  savedBy: string = 'Super Administrator',
  data: {
    students: any[];
    records: any[];
    examPreps: any[];
    fees: any[];
    teachers?: any[];
    books?: any[];
    buses?: any[];
    notices?: any[];
  }
): Promise<{ success: boolean; snapshot?: ReferenceSnapshot; error?: string }> {
  try {
    const totalDue = (data.fees || []).reduce((sum, f) => {
      const term1Due = f.terms?.[1]?.totalDue || 0;
      const term2Due = f.terms?.[2]?.totalDue || 0;
      const term3Due = f.terms?.[3]?.totalDue || 0;
      return sum + term1Due + term2Due + term3Due;
    }, 0);

    const totalCollected = (data.fees || []).reduce((sum, f) => {
      const term1Paid = f.terms?.[1]?.paidAmount || 0;
      const term2Paid = f.terms?.[2]?.paidAmount || 0;
      const term3Paid = f.terms?.[3]?.paidAmount || 0;
      return sum + term1Paid + term2Paid + term3Paid;
    }, 0);

    const snapshotId = `snap_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const snapshot: ReferenceSnapshot = {
      id: snapshotId,
      title: title.trim() || `Official Academic Archive Snapshot - ${new Date().toLocaleDateString('en-GB')}`,
      notes: notes.trim(),
      savedAt: new Date().toISOString(),
      savedBy: savedBy || 'Super Administrator',
      metrics: {
        studentsCount: data.students?.length || 0,
        recordsCount: data.records?.length || 0,
        feesCount: data.fees?.length || 0,
        examPrepsCount: data.examPreps?.length || 0,
        teachersCount: data.teachers?.length || 0,
        libraryCount: data.books?.length || 0,
        totalDue,
        totalCollected,
        totalOutstanding: Math.max(0, totalDue - totalCollected)
      },
      payload: {
        students: data.students || [],
        records: data.records || [],
        examPreps: data.examPreps || [],
        fees: data.fees || [],
        teachers: data.teachers || [],
        books: data.books || [],
        buses: data.buses || [],
        notices: data.notices || []
      }
    };

    // Save to local cache
    try {
      const existing = JSON.parse(localStorage.getItem('sma_reference_snapshots') || '[]');
      localStorage.setItem('sma_reference_snapshots', JSON.stringify([snapshot, ...existing]));
    } catch {}

    // Save to Supabase table reference_snapshots if available
    if (supabase) {
      try {
        await supabase
          .from('reference_snapshots')
          .insert({
            id: snapshot.id,
            title: snapshot.title,
            notes: snapshot.notes,
            saved_at: snapshot.savedAt,
            saved_by: snapshot.savedBy,
            metrics: snapshot.metrics,
            payload: snapshot.payload
          });
      } catch (err) {
        console.warn('[SupabaseSync] Snapshot cloud write note:', err);
      }
    }

    return { success: true, snapshot };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed creating snapshot' };
  }
}

/**
 * Fetches all saved reference snapshots
 */
export async function fetchSupabaseSnapshots(): Promise<ReferenceSnapshot[]> {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('reference_snapshots')
        .select('*')
        .order('saved_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map(row => ({
          id: row.id,
          title: row.title,
          notes: row.notes,
          savedAt: row.saved_at,
          savedBy: row.saved_by,
          metrics: row.metrics,
          payload: row.payload
        }));
      }
    }

    // Fallback to local storage
    const cached = localStorage.getItem('sma_reference_snapshots');
    return cached ? JSON.parse(cached) : [];
  } catch {
    const cached = localStorage.getItem('sma_reference_snapshots');
    return cached ? JSON.parse(cached) : [];
  }
}

/**
 * Deletes a snapshot by ID
 */
export async function deleteSupabaseSnapshot(snapshotId: string): Promise<boolean> {
  try {
    // Delete from Supabase
    if (supabase) {
      await supabase
        .from('reference_snapshots')
        .delete()
        .eq('id', snapshotId);
    }

    // Delete from local cache
    const cached = localStorage.getItem('sma_reference_snapshots');
    if (cached) {
      const list = JSON.parse(cached);
      const filtered = list.filter((s: ReferenceSnapshot) => s.id !== snapshotId);
      localStorage.setItem('sma_reference_snapshots', JSON.stringify(filtered));
    }

    return true;
  } catch (err) {
    console.warn('[SupabaseSync] Delete snapshot error:', err);
    return false;
  }
}
