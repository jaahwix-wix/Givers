/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy
} from 'firebase/firestore';
import { db, testFirestoreConnection } from '../firebase';

/**
 * Normalizes document IDs to ensure they are safe for Firestore document keys.
 */
export function cleanDocId(id: string): string {
  if (!id) return `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const cleaned = String(id).replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '');
  return (cleaned || `doc_${Date.now()}`).slice(0, 128);
}

/**
 * Compresses an image base64 data URL to keep Firestore document sizes well below 1 MB.
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
 * Recursively strips `undefined` values because Cloud Firestore rejects `undefined` fields.
 */
export function sanitizeForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (typeof obj === 'number' && Number.isNaN(obj)) {
    return 0 as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        clean[key] = sanitizeForFirestore(value);
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
 * Synchronizes a Firestore collection in real time using onSnapshot with instant localStorage cache.
 */
export function syncFirestoreCollection<T extends { id?: string; studentId?: string }>(
  collectionName: string,
  localStorageKey: string,
  onData: (items: T[]) => void,
  fallbackInitialData: T[] = [],
  idField: 'id' | 'studentId' = 'id'
): () => void {
  // 1. Immediately read from localStorage cache for instant UI display
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
  } catch {
    onData([]);
  }

  let isSubscribed = true;

  // 2. Attach real-time Firestore listener
  let unsubscribe = () => {};
  try {
    const colRef = collection(db, collectionName);
    unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (!isSubscribed) return;

        if (!snapshot.empty) {
          const items: T[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data() as T;
            if (!data.id && idField === 'id') {
              (data as any).id = docSnap.id;
            }
            if (!data.studentId && idField === 'studentId') {
              (data as any).studentId = docSnap.id;
            }
            return data;
          });

          onData(items);
          try {
            localStorage.setItem(localStorageKey, JSON.stringify(items));
          } catch (e) {
            console.warn(`[FirebaseSync] Failed updating local storage for ${collectionName}:`, e);
          }
        } else if (!snapshot.metadata.fromCache) {
          // Confirmed empty on server
          if (isLiveProductionMode()) {
            onData([]);
            try {
              localStorage.setItem(localStorageKey, JSON.stringify([]));
            } catch {}
            return;
          }

          if (fallbackInitialData.length > 0) {
            batchSaveToFirestore(collectionName, fallbackInitialData, idField);
            onData(fallbackInitialData);
            try {
              localStorage.setItem(localStorageKey, JSON.stringify(fallbackInitialData));
            } catch {}
          } else {
            onData([]);
          }
        }
      },
      (error) => {
        console.warn(`[FirebaseSync] Listener notice for ${collectionName}:`, error?.message || error);
      }
    );
  } catch (err) {
    console.warn(`[FirebaseSync] Failed attaching listener for ${collectionName}:`, err);
  }

  return () => {
    isSubscribed = false;
    unsubscribe();
  };
}

/**
 * Synchronizes a single Firestore document in real time (e.g., bus_assignments/active_allocations).
 */
export function syncFirestoreDoc<T>(
  collectionName: string,
  docId: string,
  onData: (data: T | null) => void
): () => void {
  let isSubscribed = true;
  let unsubscribe = () => {};

  try {
    const docRef = doc(db, collectionName, cleanDocId(docId));
    unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (!isSubscribed) return;
        if (docSnap.exists()) {
          onData(docSnap.data() as T);
        }
      },
      (error) => {
        console.warn(`[FirebaseSync] Doc listener notice for ${collectionName}/${docId}:`, error?.message || error);
      }
    );
  } catch (err) {
    console.warn(`[FirebaseSync] Failed attaching doc listener for ${collectionName}/${docId}:`, err);
  }

  return () => {
    isSubscribed = false;
    unsubscribe();
  };
}

/**
 * Saves a single document to Cloud Firestore.
 */
export async function saveToFirestore<T extends Record<string, any>>(
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

    const sanitized = sanitizeForFirestore({
      ...payload,
      updatedAt: new Date().toISOString()
    });

    await setDoc(doc(db, collectionName, safeDocId), sanitized, { merge: true });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('sma_firebase_saved', {
          detail: { collection: collectionName, id: safeDocId }
        })
      );
    }
    return true;
  } catch (error) {
    console.warn(`[FirebaseSync] Failed saving document ${safeDocId} to ${collectionName}:`, error);
    return false;
  }
}

/**
 * Deletes a single document from Cloud Firestore.
 */
export async function deleteFromFirestore(
  collectionName: string,
  docId: string
): Promise<boolean> {
  const safeDocId = cleanDocId(docId);
  try {
    await deleteDoc(doc(db, collectionName, safeDocId));
    return true;
  } catch (error) {
    console.warn(`[FirebaseSync] Failed deleting document ${safeDocId} from ${collectionName}:`, error);
    return false;
  }
}

/**
 * Batch saves multiple documents to Cloud Firestore (chunked in batches of 400).
 */
export async function batchSaveToFirestore<T extends Record<string, any>>(
  collectionName: string,
  items: T[],
  idField: keyof T = 'id'
): Promise<boolean> {
  try {
    if (!items || items.length === 0) return true;

    const prepared = await Promise.all(
      items.map(async (item) => {
        const rawId = String(
          item[idField] ||
            (item as any).studentId ||
            `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
        );
        const safeDocId = cleanDocId(rawId);

        const payload: Record<string, any> = { ...item };
        if (typeof payload.profileImage === 'string' && payload.profileImage.startsWith('data:image')) {
          payload.profileImage = await compressImageBase64(payload.profileImage, 320, 0.75);
        }

        return {
          safeDocId,
          data: sanitizeForFirestore({
            ...payload,
            updatedAt: new Date().toISOString()
          })
        };
      })
    );

    const CHUNK_SIZE = 400;
    for (let i = 0; i < prepared.length; i += CHUNK_SIZE) {
      const chunk = prepared.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach(({ safeDocId, data }) => {
        batch.set(doc(db, collectionName, safeDocId), data, { merge: true });
      });
      await batch.commit();
    }

    return true;
  } catch (error) {
    console.warn(`[FirebaseSync] Batch save failed for ${collectionName}:`, error);
    return false;
  }
}

/**
 * Purges all documents in a Cloud Firestore collection.
 */
export async function clearFirestoreCollection(collectionName: string): Promise<boolean> {
  try {
    const snap = await getDocs(collection(db, collectionName));
    if (snap.empty) return true;

    const docs = snap.docs;
    const CHUNK_SIZE = 400;
    for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
      const chunk = docs.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    return true;
  } catch (error) {
    console.warn(`[FirebaseSync] Clear collection failed for ${collectionName}:`, error);
    return false;
  }
}

const OPERATIONAL_COLLECTIONS = [
  'students',
  'academic_records',
  'exam_preps',
  'fee_ledgers',
  'teachers',
  'assignments',
  'submissions',
  'announcements',
  'class_notices',
  'buses',
  'bus_assignments',
  'daily_attendance',
  'incidents',
  'library_books',
  'library_checkouts'
];

/**
 * Completely purges ALL school operational collections from Cloud Firestore.
 */
export async function clearAllFirestoreSchoolData(): Promise<void> {
  await Promise.all(
    OPERATIONAL_COLLECTIONS.map((col) =>
      clearFirestoreCollection(col).catch((err) =>
        console.warn(`[FirebaseSync] Clear ${col} note:`, err)
      )
    )
  );
}

/**
 * Checks if Firebase Firestore backend is reachable and responsive.
 */
export async function checkFirebaseSyncStatus(): Promise<boolean> {
  return testFirestoreConnection();
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
 * Saves all current school records to Cloud Firestore across all core collections.
 */
export async function saveAllSchoolRecordsToFirestore(data: {
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
    notices: data.notices?.length || 0
  };

  try {
    const tasks: Promise<boolean>[] = [];
    if (data.students?.length) tasks.push(batchSaveToFirestore('students', data.students, 'id'));
    if (data.records?.length) tasks.push(batchSaveToFirestore('academic_records', data.records, 'studentId'));
    if (data.fees?.length) tasks.push(batchSaveToFirestore('fee_ledgers', data.fees, 'studentId'));
    if (data.examPreps?.length) tasks.push(batchSaveToFirestore('exam_preps', data.examPreps, 'studentId'));
    if (data.teachers?.length) tasks.push(batchSaveToFirestore('teachers', data.teachers, 'id'));
    if (data.books?.length) tasks.push(batchSaveToFirestore('library_books', data.books, 'id'));
    if (data.buses?.length) tasks.push(batchSaveToFirestore('buses', data.buses, 'id'));
    if (data.notices?.length) tasks.push(batchSaveToFirestore('class_notices', data.notices, 'id'));

    const results = await Promise.all(tasks);
    const allOk = results.every(Boolean);
    return { success: allOk, counts };
  } catch (error) {
    console.error('[FirebaseSync] saveAllSchoolRecordsToFirestore failed:', error);
    return { success: false, counts };
  }
}

/**
 * Strips large base64 data URLs from snapshot payloads so the snapshot stays within Firestore's 1 MB document limit.
 */
function stripOversizedImages(items: any[]): any[] {
  return (items || []).map((item) => {
    if (!item || typeof item !== 'object') return item;
    const copy = { ...item };
    if (typeof copy.profileImage === 'string' && copy.profileImage.length > 50000) {
      delete copy.profileImage;
    }
    return copy;
  });
}

/**
 * Creates an immutable point-in-time Snapshot in Cloud Firestore.
 */
export async function createFirestoreSnapshot(
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
        students: stripOversizedImages(data.students || []),
        records: data.records || [],
        examPreps: data.examPreps || [],
        fees: data.fees || [],
        teachers: stripOversizedImages(data.teachers || []),
        books: data.books || [],
        buses: data.buses || [],
        notices: data.notices || []
      }
    };

    try {
      const existing = JSON.parse(localStorage.getItem('sma_reference_snapshots') || '[]');
      localStorage.setItem('sma_reference_snapshots', JSON.stringify([snapshot, ...existing]));
    } catch {}

    await setDoc(doc(db, 'reference_snapshots', snapshotId), sanitizeForFirestore(snapshot));

    return { success: true, snapshot };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed creating Firestore snapshot' };
  }
}

/**
 * Fetches all saved reference snapshots from Cloud Firestore (with localStorage fallback).
 */
export async function fetchFirestoreSnapshots(): Promise<ReferenceSnapshot[]> {
  try {
    const q = query(collection(db, 'reference_snapshots'), orderBy('savedAt', 'desc'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const items = snap.docs.map((d) => ({ ...(d.data() as ReferenceSnapshot), id: d.id }));
      try {
        localStorage.setItem('sma_reference_snapshots', JSON.stringify(items));
      } catch {}
      return items;
    }

    const cached = localStorage.getItem('sma_reference_snapshots');
    return cached ? JSON.parse(cached) : [];
  } catch (err) {
    console.warn('[FirebaseSync] Fetching snapshots from cache:', err);
    try {
      const cached = localStorage.getItem('sma_reference_snapshots');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  }
}

/**
 * Deletes a reference snapshot by ID from Cloud Firestore & local cache.
 */
export async function deleteFirestoreSnapshot(snapshotId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'reference_snapshots', cleanDocId(snapshotId)));

    try {
      const cached = localStorage.getItem('sma_reference_snapshots');
      if (cached) {
        const list = JSON.parse(cached);
        const filtered = list.filter((s: ReferenceSnapshot) => s.id !== snapshotId);
        localStorage.setItem('sma_reference_snapshots', JSON.stringify(filtered));
      }
    } catch {}

    return true;
  } catch (err) {
    console.warn('[FirebaseSync] Delete snapshot error:', err);
    return false;
  }
}
