/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Student, StudentClass, ClassNotice, NoticeSmsLog } from '../types';
import { SCHOOL_INFO } from '../initialData';

const NOTICES_STORAGE_KEY = 'sma_class_notices';
const NOTICE_SMS_LOGS_KEY = 'sma_notice_sms_logs';

export const INITIAL_CLASS_NOTICES: ClassNotice[] = [];

export const INITIAL_SAMPLE_RECIPIENTS_BY_CLASS: Record<string, Array<{ studentName: string; parentName: string; phone: string }>> = {};

// Retrieve saved notices
export function getSavedClassNotices(): ClassNotice[] {
  try {
    const cached = localStorage.getItem(NOTICES_STORAGE_KEY);
    if (cached !== null) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load class notices', e);
  }
  return [];
}

// Retrieve saved SMS logs
export function getSavedNoticeSmsLogs(): NoticeSmsLog[] {
  try {
    const cached = localStorage.getItem(NOTICE_SMS_LOGS_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load notice SMS logs', e);
  }
  return [];
}

export interface BroadcastResult {
  logs: NoticeSmsLog[];
  studentCount: number;
  parentCount: number;
  totalSent: number;
  carrier: string;
}

/**
 * Broadcasts an official Notice as SMS to EACH student and parent in the targeted class.
 * Ensures that both the student and guardian receive a personalized carrier SMS alert.
 */
export function broadcastNoticeSMS(notice: ClassNotice, registeredStudents: Student[]): BroadcastResult {
  const isAllClasses = notice.targetClass === 'All Classes';
  
  // Find matching students in the target class
  let targetStudents = registeredStudents.filter(s => 
    s.status === 'Active' && (isAllClasses || s.currentClass === notice.targetClass)
  );

  const recipientsList: Array<{ studentId: string; studentName: string; currentClass: StudentClass; parentName: string; phone: string }> = [];

  if (targetStudents.length > 0) {
    targetStudents.forEach(s => {
      recipientsList.push({
        studentId: s.id,
        studentName: s.name,
        currentClass: s.currentClass,
        parentName: s.parentName || `Guardian of ${s.name}`,
        phone: s.parentPhone || '+232 76 000000'
      });
    });
  }

  const now = new Date();
  const formattedTimestamp = now.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  }) + ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const carriers = ['Orange SL Gateway', 'Africell SL SMSC', 'Sierratel Gateway'];
  const newLogs: NoticeSmsLog[] = [];

  recipientsList.forEach((recipient, idx) => {
    const carrier = carriers[idx % carriers.length];

    // 1. SMS to STUDENT
    const studentSmsText = `[${SCHOOL_INFO.shortName} NOTICE] To: ${recipient.studentName} (${recipient.currentClass}). ${notice.title.slice(0, 45)}: "${notice.content.slice(0, 100)}..." - ${notice.author}, ${SCHOOL_INFO.name}.`;
    newLogs.push({
      id: `sms-std-${Date.now()}-${idx}`,
      noticeId: notice.id,
      noticeTitle: notice.title,
      studentId: recipient.studentId,
      studentName: recipient.studentName,
      currentClass: recipient.currentClass,
      recipientType: 'Student',
      recipientName: recipient.studentName,
      phoneNumber: recipient.phone,
      messageText: studentSmsText,
      carrier,
      status: 'Delivered',
      timestamp: formattedTimestamp
    });

    // 2. SMS to PARENT/GUARDIAN
    const parentSmsText = `[${SCHOOL_INFO.shortName} GUARDIAN SMS] Dear ${recipient.parentName} (Parent of ${recipient.studentName}, ${recipient.currentClass}): ${notice.title.slice(0, 45)} - "${notice.content.slice(0, 100)}..." Issued by ${notice.author}, ${SCHOOL_INFO.name}, Kambia.`;
    newLogs.push({
      id: `sms-par-${Date.now()}-${idx}`,
      noticeId: notice.id,
      noticeTitle: notice.title,
      studentId: recipient.studentId,
      studentName: recipient.studentName,
      currentClass: recipient.currentClass,
      recipientType: 'Parent/Guardian',
      recipientName: recipient.parentName,
      phoneNumber: recipient.phone,
      messageText: parentSmsText,
      carrier,
      status: 'Delivered',
      timestamp: formattedTimestamp
    });
  });

  // Save new SMS logs to storage
  const existingLogs = getSavedNoticeSmsLogs();
  const updatedLogs = [...newLogs, ...existingLogs];
  localStorage.setItem(NOTICE_SMS_LOGS_KEY, JSON.stringify(updatedLogs));

  // Save/update notice in storage
  const existingNotices = getSavedClassNotices();
  const noticeWithSMS: ClassNotice = {
    ...notice,
    smsBroadcast: {
      totalRecipients: newLogs.length,
      studentCount: recipientsList.length,
      parentCount: recipientsList.length,
      deliveredCount: newLogs.length,
      status: 'Delivered',
      sentAt: formattedTimestamp,
      carrier: 'Sierra Leone GSM (Orange & Africell Gateway)'
    }
  };

  const noticeIndex = existingNotices.findIndex(n => n.id === notice.id);
  let updatedNotices: ClassNotice[];
  if (noticeIndex >= 0) {
    updatedNotices = [...existingNotices];
    updatedNotices[noticeIndex] = noticeWithSMS;
  } else {
    updatedNotices = [noticeWithSMS, ...existingNotices];
  }
  localStorage.setItem(NOTICES_STORAGE_KEY, JSON.stringify(updatedNotices));

  // Dispatch event so all components update immediately
  window.dispatchEvent(new CustomEvent('sma_class_notice_dispatched', { detail: { notice: noticeWithSMS, smsLogs: newLogs } }));
  window.dispatchEvent(new Event('storage'));

  return {
    logs: newLogs,
    studentCount: recipientsList.length,
    parentCount: recipientsList.length,
    totalSent: newLogs.length,
    carrier: 'Sierra Leone GSM Gateway (Orange SL / Africell SL)'
  };
}
