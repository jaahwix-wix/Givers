/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Normalizes document IDs to ensure they do not contain slashes ('/')
 * which Firestore interprets as subcollection path delimiters.
 */
export function cleanDocId(id: string): string {
  if (!id) return `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  return String(id).replace(/[\/\s#\?\[\]]+/g, '_');
}

/**
 * Compresses an image base64 data URL to ensure it never exceeds Firestore's 1MB limit.
 */
export async function compressImageBase64(
  dataUrl: string, 
  maxDim = 300, 
  quality = 0.75
): Promise<string> {
  if (typeof window === 'undefined' || !dataUrl || !dataUrl.startsWith('data:image')) {
    return dataUrl;
  }
  // If already under 120KB, no need to re-encode
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
 * Removes `undefined` values and ensures the data can be safely stored in Cloud Firestore.
 * Cloud Firestore rejects documents containing undefined fields.
 */
export function sanitizeForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore) as unknown as T;
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

/**
 * Synchronizes a Firestore collection in real-time with local state and localStorage cache.
 * Returns an unsubscribe function to cancel the listener when the component unmounts.
 */
export function syncFirestoreCollection<T extends { id?: string; studentId?: string }>(
  collectionName: string,
  localStorageKey: string,
  onData: (items: T[]) => void,
  fallbackInitialData: T[] = []
): Unsubscribe {
  // 1. Immediately read from localStorage cache for instant zero-latency UI display
  try {
    const cached = localStorage.getItem(localStorageKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        onData(parsed);
      }
    }
  } catch (err) {
    console.warn(`[FirestoreSync] Failed reading cache for ${collectionName}:`, err);
  }

  // 2. Attach real-time Firestore collection listener
  try {
    const colRef = collection(db, collectionName);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const isLiveProduction = typeof window !== 'undefined' && 
          localStorage.getItem('sma_live_production_active') === 'true';

        if (!snapshot.empty) {
          const items: T[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as T;
            // Ensure ID and studentId are populated from the document ID
            if (!data.id && docSnap.id) {
              (data as any).id = docSnap.id;
            }
            if (!data.studentId && docSnap.id) {
              (data as any).studentId = docSnap.id;
            }
            items.push(data);
          });

          // Update state and refresh local storage cache
          onData(items);
          try {
            localStorage.setItem(localStorageKey, JSON.stringify(items));
          } catch (e) {
            console.warn(`[FirestoreSync] Failed to update cache for ${collectionName}:`, e);
          }
        } else {
          // Collection is empty in Firestore.
          // Check if local storage has valid items to migrate up to Firestore
          try {
            const cached = localStorage.getItem(localStorageKey);
            if (cached) {
              const localItems = JSON.parse(cached);
              if (Array.isArray(localItems) && localItems.length > 0) {
                // Auto-seed Firestore from existing local records
                batchSaveToFirestore(collectionName, localItems);
                onData(localItems);
                return;
              }
            }
          } catch (e) {
            console.warn(`[FirestoreSync] Error checking local cache for migration to ${collectionName}:`, e);
          }

          // If both Firestore and local cache are empty, automatically seed foundational reference records
          if (fallbackInitialData.length > 0) {
            batchSaveToFirestore(collectionName, fallbackInitialData);
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
        console.warn(`[FirestoreSync] Realtime sync error for ${collectionName} (operating with local cache):`, error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn(`[FirestoreSync] Failed to initiate listener for ${collectionName}:`, err);
    return () => {};
  }
}

/**
 * Saves a single document to Firestore and updates local cache.
 */
export async function saveToFirestore<T extends Record<string, any>>(
  collectionName: string,
  docId: string,
  data: T
): Promise<boolean> {
  const safeDocId = cleanDocId(docId);
  try {
    // If the object contains a profileImage, compress it if it's large
    const payload: Record<string, any> = { ...data };
    if (typeof payload.profileImage === 'string' && payload.profileImage.startsWith('data:image')) {
      payload.profileImage = await compressImageBase64(payload.profileImage, 320, 0.75);
    }

    const sanitized = sanitizeForFirestore(payload);
    await setDoc(doc(db, collectionName, safeDocId), sanitized, { merge: true });
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sma_firestore_saved', { 
        detail: { collection: collectionName, id: safeDocId } 
      }));
    }
    return true;
  } catch (error) {
    console.error(`[FirestoreSync] Failed saving document ${safeDocId} to ${collectionName}:`, error);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sma_firestore_error', { 
        detail: { collection: collectionName, id: safeDocId, error } 
      }));
    }
    return false;
  }
}

/**
 * Deletes a single document from Firestore.
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
    console.warn(`[FirestoreSync] Failed deleting document ${safeDocId} from ${collectionName}:`, error);
    return false;
  }
}

/**
 * Batch saves multiple documents to Firestore.
 */
export async function batchSaveToFirestore<T extends Record<string, any>>(
  collectionName: string,
  items: T[],
  idField: keyof T = 'id'
): Promise<boolean> {
  try {
    for (const item of items) {
      const rawId = String(item[idField] || (item as any).studentId || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
      const safeDocId = cleanDocId(rawId);
      
      const payload: Record<string, any> = { ...item };
      if (typeof payload.profileImage === 'string' && payload.profileImage.startsWith('data:image')) {
        payload.profileImage = await compressImageBase64(payload.profileImage, 320, 0.75);
      }
      
      const sanitized = sanitizeForFirestore(payload);
      await setDoc(doc(db, collectionName, safeDocId), sanitized, { merge: true });
    }
    return true;
  } catch (error) {
    console.warn(`[FirestoreSync] Batch save failed for ${collectionName}:`, error);
    return false;
  }
}

/**
 * Purges all documents in a Firestore collection.
 */
export async function clearFirestoreCollection(collectionName: string): Promise<boolean> {
  try {
    const snap = await getDocs(collection(db, collectionName));
    const deletePromises = snap.docs.map((docSnap) => deleteDoc(docSnap.ref));
    await Promise.all(deletePromises);
    return true;
  } catch (error) {
    console.warn(`[FirestoreSync] Clear collection failed for ${collectionName}:`, error);
    return false;
  }
}

/**
 * Completely purges ALL school operational collections from Cloud Firestore.
 * Used when switching to live production with a 100% clean slate.
 */
export async function clearAllFirestoreSchoolData(): Promise<void> {
  const collectionsToClear = [
    'students',
    'academic_records',
    'fee_ledgers',
    'exam_preps',
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
    'library_checkouts',
  ];

  await Promise.allSettled(
    collectionsToClear.map(col => clearFirestoreCollection(col))
  );
}

/**
 * Checks if Cloud Firestore backend is reachable and responsive.
 */
export async function checkFirestoreSyncStatus(): Promise<boolean> {
  try {
    const snap = await getDocs(collection(db, 'students'));
    return !snap.metadata.fromCache;
  } catch {
    return false;
  }
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
    students: 0,
    records: 0,
    fees: 0,
    examPreps: 0,
    teachers: 0,
    books: 0,
    buses: 0,
    notices: 0,
  };

  try {
    if (data.students && data.students.length > 0) {
      await batchSaveToFirestore('students', data.students, 'id');
      counts.students = data.students.length;
    }

    if (data.records && data.records.length > 0) {
      await batchSaveToFirestore('academic_records', data.records, 'studentId');
      counts.records = data.records.length;
    }

    if (data.fees && data.fees.length > 0) {
      await batchSaveToFirestore('fee_ledgers', data.fees, 'studentId');
      counts.fees = data.fees.length;
    }

    if (data.examPreps && data.examPreps.length > 0) {
      await batchSaveToFirestore('exam_preps', data.examPreps, 'id');
      counts.examPreps = data.examPreps.length;
    }

    if (data.teachers && data.teachers.length > 0) {
      await batchSaveToFirestore('teachers', data.teachers, 'id');
      counts.teachers = data.teachers.length;
    }

    if (data.books && data.books.length > 0) {
      await batchSaveToFirestore('library_books', data.books, 'id');
      counts.books = data.books.length;
    }

    if (data.buses && data.buses.length > 0) {
      await batchSaveToFirestore('buses', data.buses, 'id');
      counts.buses = data.buses.length;
    }

    if (data.notices && data.notices.length > 0) {
      await batchSaveToFirestore('class_notices', data.notices, 'id');
      counts.notices = data.notices.length;
    }

    return { success: true, counts };
  } catch (err) {
    console.error('[FirestoreSync] Failed saving all records to Firestore:', err);
    return { success: false, counts };
  }
}

/**
 * Creates and archives an immutable reference snapshot in Cloud Firestore for institutional records & historical audit.
 */
export async function createReferenceSnapshot(
  title: string,
  notes: string,
  savedBy: string,
  data: {
    students: any[];
    records: any[];
    examPreps: any[];
    fees: any[];
    teachers?: any[];
    books?: any[];
  }
): Promise<ReferenceSnapshot | null> {
  try {
    const snapshotId = `ref_${Date.now()}`;
    
    let totalDue = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    (data.fees || []).forEach(f => {
      [1, 2, 3].forEach(termNum => {
        const t = f?.terms?.[termNum];
        if (t) {
          totalDue += Number(t.totalDue) || 0;
          totalCollected += Number(t.paidAmount) || 0;
          totalOutstanding += Number(t.balance) || 0;
        }
      });
    });

    const snapshotDoc: ReferenceSnapshot = {
      id: snapshotId,
      title: title.trim() || `Reference Archive ${new Date().toLocaleDateString('en-GB')}`,
      notes: notes.trim() || 'Institutional database backup archived for historical reference uses.',
      savedAt: new Date().toISOString(),
      savedBy: savedBy || 'Administrator (Evangelist Saint Turay)',
      metrics: {
        studentsCount: data.students?.length || 0,
        recordsCount: data.records?.length || 0,
        feesCount: data.fees?.length || 0,
        examPrepsCount: data.examPreps?.length || 0,
        teachersCount: data.teachers?.length || 0,
        libraryCount: data.books?.length || 0,
        totalDue,
        totalCollected,
        totalOutstanding,
      },
      payload: {
        students: data.students || [],
        records: data.records || [],
        examPreps: data.examPreps || [],
        fees: data.fees || [],
        teachers: data.teachers || [],
        books: data.books || []
      }
    };

    const sanitized = sanitizeForFirestore(snapshotDoc);
    await setDoc(doc(db, 'reference_snapshots', snapshotId), sanitized);
    return snapshotDoc;
  } catch (err) {
    console.error('[FirestoreSync] Error creating reference snapshot:', err);
    return null;
  }
}

/**
 * Fetches all saved reference snapshots from Cloud Firestore.
 */
export async function fetchReferenceSnapshots(): Promise<ReferenceSnapshot[]> {
  try {
    const snap = await getDocs(collection(db, 'reference_snapshots'));
    const list: ReferenceSnapshot[] = [];
    snap.forEach(d => {
      list.push(d.data() as ReferenceSnapshot);
    });
    // Sort latest first
    return list.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  } catch (err) {
    console.warn('[FirestoreSync] Failed fetching reference snapshots:', err);
    return [];
  }
}

/**
 * Deletes a reference snapshot document from Cloud Firestore.
 */
export async function deleteReferenceSnapshot(snapshotId: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'reference_snapshots', snapshotId));
    return true;
  } catch (err) {
    console.warn('[FirestoreSync] Failed deleting reference snapshot:', err);
    return false;
  }
}

