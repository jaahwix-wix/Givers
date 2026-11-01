/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { saveToFirestore } from '../services/firestoreSync';

export type ReferenceEntryType =
  | 'Student Registration'
  | 'Student Profile Update'
  | 'Student Record Deletion'
  | 'Tuition Payment Receipt'
  | 'Continuous Assessment Grade'
  | 'National Exam Prep'
  | 'Staff Faculty Registration'
  | 'Staff Record Deletion'
  | 'Official Notice Broadcast'
  | 'Library Book Acquisition'
  | 'Library Book Checkout'
  | 'Daily Attendance Register'
  | 'Disciplinary Incident Record'
  | 'Database System Wipe';

export type ReferenceCategory = 
  | 'Registry' 
  | 'Academics' 
  | 'Finance' 
  | 'Staff' 
  | 'Logistics' 
  | 'Library' 
  | 'System';

export interface DataEntryReference {
  id: string;
  referenceNumber: string;
  type: ReferenceEntryType;
  category: ReferenceCategory;
  title: string;
  summary: string;
  performedBy: string;
  timestamp: string;
  formattedDate: string;
  targetId?: string;
  details?: any;
  status: 'Saved & Active' | 'Historical Reference' | 'Deleted From Registry';
}

export const REFERENCE_STORAGE_KEY = 'sma_data_entry_reference_log';

/**
 * Retrieve all saved reference entries from local cache
 */
export function getAllReferenceEntries(): DataEntryReference[] {
  try {
    const raw = localStorage.getItem(REFERENCE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[ReferenceLog] Failed reading entries from cache:', err);
    return [];
  }
}

/**
 * Saves a single reference entry into persistent storage (Cloud Firestore & LocalStorage)
 */
export function recordDataEntry(params: {
  type: ReferenceEntryType;
  category: ReferenceCategory;
  title: string;
  summary: string;
  performedBy?: string;
  targetId?: string;
  details?: any;
  status?: 'Saved & Active' | 'Historical Reference' | 'Deleted From Registry';
}): DataEntryReference {
  const now = new Date();
  const id = `ref_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const randCode = Math.floor(10000 + Math.random() * 90000);
  const referenceNumber = `REF-${now.getFullYear()}-${randCode}`;

  const formattedDate = now.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const entry: DataEntryReference = {
    id,
    referenceNumber,
    type: params.type,
    category: params.category,
    title: params.title,
    summary: params.summary,
    performedBy: params.performedBy || 'System Administrator',
    timestamp: now.toISOString(),
    formattedDate,
    targetId: params.targetId,
    details: params.details || null,
    status: params.status || 'Saved & Active'
  };

  try {
    const current = getAllReferenceEntries();
    const updated = [entry, ...current];
    // Keep up to 2,000 reference entries locally
    const bounded = updated.slice(0, 2000);
    localStorage.setItem(REFERENCE_STORAGE_KEY, JSON.stringify(bounded));

    // Persist to Cloud Firestore reference collection
    saveToFirestore('reference_audit_logs', id, entry);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sma_reference_logged', { detail: entry }));
    }
  } catch (e) {
    console.warn('[ReferenceLog] Error saving entry:', e);
  }

  return entry;
}

/**
 * Downloads the full Reference Audit Log as an RFC 4180 CSV spreadsheet
 */
export function exportReferenceEntriesCSV(entries?: DataEntryReference[]): void {
  const records = entries || getAllReferenceEntries();
  if (records.length === 0) {
    return;
  }

  const headers = [
    'Reference Number',
    'Date & Time',
    'Category',
    'Entry Type',
    'Title / Description',
    'Summary Details',
    'Performed By',
    'Target ID',
    'Status'
  ];

  const rows = records.map(r => [
    r.referenceNumber,
    r.formattedDate,
    r.category,
    r.type,
    r.title,
    r.summary,
    r.performedBy,
    r.targetId || 'N/A',
    r.status
  ]);

  const csvContent = '\uFEFF' + [headers, ...rows].map(row => 
    row.map(field => {
      const str = String(field ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',')
  ).join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Givers_World_Mission_Data_Entry_References_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads the full Reference Audit Log as JSON
 */
export function exportReferenceEntriesJSON(entries?: DataEntryReference[]): void {
  const records = entries || getAllReferenceEntries();
  const payload = {
    institution: 'Givers World Mission Diplomats Academy & College',
    exportType: 'Institutional Data Entry Reference Archive',
    totalEntries: records.length,
    exportedAt: new Date().toISOString(),
    entries: records
  };

  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `GWM_Data_Entry_Reference_Archive_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
