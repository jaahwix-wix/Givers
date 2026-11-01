/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DEMO_SAMPLE_STUDENTS,
  DEMO_SAMPLE_ACADEMIC_RECORDS,
  DEMO_SAMPLE_NATIONAL_EXAMS,
  DEMO_SAMPLE_FEE_LEDGERS,
  DEFAULT_SCHOOL_ANNOUNCEMENTS,
  DEFAULT_SAMPLE_TEACHERS,
  DEFAULT_SAMPLE_ASSIGNMENTS,
  DEFAULT_SAMPLE_SUBMISSIONS
} from '../initialData';

export const DATA_STORAGE_KEYS = [
  'sma_students',
  'sma_academic_records',
  'sma_exam_preps',
  'sma_fee_ledgers',
  'sma_teachers',
  'sma_assignments',
  'sma_submissions',
  'sma_announcements',
  'sma_read_notifications',
  'sma_library_books',
  'sma_library_checkouts',
  'sma_buses',
  'sma_bus_assignments',
  'sma_daily_attendance',
  'sma_incidents',
  'sma_fee_sms_dispatch_log',
] as const;

export const LIVE_MODE_INDICATOR_KEY = 'sma_live_production_active';

/**
 * Completely purges all mock, test, and transient data across all modules
 * to ensure the school system is completely clean for live production use.
 */
export function wipeAllSystemData(): void {
  // Clear core school registry keys
  localStorage.setItem('sma_students', JSON.stringify([]));
  localStorage.setItem('sma_academic_records', JSON.stringify([]));
  localStorage.setItem('sma_exam_preps', JSON.stringify([]));
  localStorage.setItem('sma_fee_ledgers', JSON.stringify([]));
  
  // Clear staff, assignments, and submissions
  localStorage.setItem('sma_teachers', JSON.stringify([]));
  localStorage.setItem('sma_assignments', JSON.stringify([]));
  localStorage.setItem('sma_submissions', JSON.stringify([]));
  localStorage.setItem('sma_announcements', JSON.stringify([]));
  localStorage.setItem('sma_read_notifications', JSON.stringify([]));

  // Clear library catalog and checkouts
  localStorage.setItem('sma_library_books', JSON.stringify([]));
  localStorage.setItem('sma_library_checkouts', JSON.stringify([]));

  // Clear bus fleet and student transport allocations
  localStorage.setItem('sma_buses', JSON.stringify([]));
  localStorage.setItem('sma_bus_assignments', JSON.stringify({}));

  // Clear daily attendance logs and disciplinary incident reports
  localStorage.setItem('sma_daily_attendance', JSON.stringify([]));
  localStorage.setItem('sma_incidents', JSON.stringify([]));
  localStorage.setItem('sma_fee_sms_dispatch_log', JSON.stringify([]));
  localStorage.setItem('sma_class_notices', JSON.stringify([]));
  localStorage.setItem('sma_notice_sms_logs', JSON.stringify([]));

  // Mark live production status
  localStorage.setItem(LIVE_MODE_INDICATOR_KEY, 'true');

  // Trigger cross-component sync event
  window.dispatchEvent(new CustomEvent('sma_database_wiped'));
  window.dispatchEvent(new Event('storage'));
}

/**
 * Loads sample demo data into local storage for staging or demonstration purposes.
 */
export function loadSampleDemoData(): void {
  localStorage.setItem('sma_students', JSON.stringify(DEMO_SAMPLE_STUDENTS));
  localStorage.setItem('sma_academic_records', JSON.stringify(DEMO_SAMPLE_ACADEMIC_RECORDS));
  localStorage.setItem('sma_exam_preps', JSON.stringify(DEMO_SAMPLE_NATIONAL_EXAMS));
  localStorage.setItem('sma_fee_ledgers', JSON.stringify(DEMO_SAMPLE_FEE_LEDGERS));
  localStorage.setItem('sma_teachers', JSON.stringify(DEFAULT_SAMPLE_TEACHERS));
  localStorage.setItem('sma_assignments', JSON.stringify(DEFAULT_SAMPLE_ASSIGNMENTS));
  localStorage.setItem('sma_submissions', JSON.stringify(DEFAULT_SAMPLE_SUBMISSIONS));
  localStorage.setItem('sma_announcements', JSON.stringify(DEFAULT_SCHOOL_ANNOUNCEMENTS));
  localStorage.setItem('sma_read_notifications', JSON.stringify([]));
  localStorage.setItem(LIVE_MODE_INDICATOR_KEY, 'false');

  window.dispatchEvent(new CustomEvent('sma_database_loaded_demo'));
  window.dispatchEvent(new Event('storage'));
}

/**
 * Quick query for current database counts
 */
export function getDatabaseAuditCounts() {
  const getArrayLength = (key: string): number => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return 0;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  };

  return {
    students: getArrayLength('sma_students'),
    records: getArrayLength('sma_academic_records'),
    examPreps: getArrayLength('sma_exam_preps'),
    feeLedgers: getArrayLength('sma_fee_ledgers'),
    teachers: getArrayLength('sma_teachers'),
    assignments: getArrayLength('sma_assignments'),
    books: getArrayLength('sma_library_books'),
    buses: getArrayLength('sma_buses'),
    attendance: getArrayLength('sma_daily_attendance'),
    incidents: getArrayLength('sma_incidents'),
    isLive: localStorage.getItem(LIVE_MODE_INDICATOR_KEY) === 'true',
  };
}
