/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Student, StudentFeeLedger, SchoolAnnouncement, NotificationAlert, Assignment, Submission } from '../types';
import { DEFAULT_SCHOOL_ANNOUNCEMENTS, DEFAULT_SAMPLE_ASSIGNMENTS, DEFAULT_SAMPLE_SUBMISSIONS } from '../initialData';
import { LIVE_MODE_INDICATOR_KEY } from '../utils/dataStore';

interface UseNotificationsProps {
  students: Student[];
  fees: StudentFeeLedger[];
}

export function useNotifications({ students, fees }: UseNotificationsProps) {
  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('sma_read_notifications');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [announcements, setAnnouncements] = useState<SchoolAnnouncement[]>(() => {
    try {
      const stored = localStorage.getItem('sma_announcements');
      if (stored) {
        return JSON.parse(stored);
      }
      return [];
    } catch {
      return [];
    }
  });

  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    try {
      const stored = localStorage.getItem('sma_assignments');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed)) return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });

  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    try {
      const stored = localStorage.getItem('sma_submissions');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed)) return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });

  // Sync state with storage updates
  useEffect(() => {
    const syncWithStorage = () => {
      try {
        const storedAnnouncements = localStorage.getItem('sma_announcements');
        if (storedAnnouncements) {
          setAnnouncements(JSON.parse(storedAnnouncements));
        }

        const storedAssignments = localStorage.getItem('sma_assignments');
        if (storedAssignments) {
          setAssignments(JSON.parse(storedAssignments));
        }

        const storedSubmissions = localStorage.getItem('sma_submissions');
        if (storedSubmissions) {
          setSubmissions(JSON.parse(storedSubmissions));
        }

        const storedReads = localStorage.getItem('sma_read_notifications');
        if (storedReads) {
          setReadIds(JSON.parse(storedReads));
        }
      } catch (err) {
        console.error('Error syncing notifications with storage:', err);
      }
    };

    window.addEventListener('storage', syncWithStorage);
    window.addEventListener('sma_database_wiped', syncWithStorage);
    window.addEventListener('sma_database_loaded_demo', syncWithStorage);
    return () => {
      window.removeEventListener('storage', syncWithStorage);
      window.removeEventListener('sma_database_wiped', syncWithStorage);
      window.removeEventListener('sma_database_loaded_demo', syncWithStorage);
    };
  }, []);

  // Construct dynamic alerts list
  const alerts = useMemo<NotificationAlert[]>(() => {
    const list: NotificationAlert[] = [];

    // 1. URGENT & SCHOOL ANNOUNCEMENTS
    announcements.forEach((ann) => {
      list.push({
        id: `ann-${ann.id}`,
        type: 'announcement',
        title: ann.title,
        description: ann.message,
        timestamp: ann.date,
        priority: ann.priority === 'urgent' ? 'urgent' : 'normal',
        read: readIds.includes(`ann-${ann.id}`),
        linkTab: 'announcements',
        linkArgs: { announcementId: ann.id }
      });
    });

    // 2. AUTOMATED PENDING FEE FLAGS & SMS ALERT SUMMARY
    let pendingFeeCount = 0;
    let totalPendingAmount = 0;

    fees.forEach((ledger) => {
      const student = students.find((s) => s.id === ledger.studentId);
      if (!student || student.status !== 'Active') return;

      // Check Term 3 (Active current term)
      const term3 = ledger.terms?.[3];
      if (term3 && term3.status !== 'Paid' && term3.balance > 0) {
        pendingFeeCount++;
        totalPendingAmount += term3.balance;

        list.push({
          id: `fee-${student.id}-t3`,
          type: 'fee',
          title: `Pending Fee Flag: ${student.name}`,
          description: `${student.name} (${student.currentClass}) has an outstanding balance of SLE ${term3.balance.toLocaleString()} for Term 3. Guardian: ${student.parentName} (${student.parentPhone}).`,
          timestamp: 'Term 3 Active',
          priority: term3.status === 'Unpaid' ? 'urgent' : 'high',
          read: readIds.includes(`fee-${student.id}-t3`),
          linkTab: 'fees',
          linkArgs: { studentId: student.id, search: student.name, openSmsModal: true, initialTerm: 3 }
        });
      }
    });

    // Consolidated Automated Flag Notification
    if (pendingFeeCount > 0) {
      list.push({
        id: 'fee-automated-sms-summary-t3',
        type: 'fee',
        title: `Automated Fee Alert: ${pendingFeeCount} Students Flagged`,
        description: `Automated scan flagged ${pendingFeeCount} students with unpaid tuition balances totaling SLE ${totalPendingAmount.toLocaleString()}. Click to review summary and dispatch guardian SMS alerts.`,
        timestamp: 'Automated Real-time',
        priority: 'urgent',
        read: readIds.includes('fee-automated-sms-summary-t3'),
        linkTab: 'fees',
        linkArgs: { openSmsModal: true, initialTerm: 3 }
      });
    }

    // 3. NEW ASSIGNMENT UPLOADS
    assignments.forEach((assign) => {
      list.push({
        id: `assign-${assign.id}`,
        type: 'assignment',
        title: `Assignment: ${assign.subject}`,
        description: `"${assign.title}" posted for ${assign.className} by ${assign.teacherName}. Due: ${assign.dueDate}.`,
        timestamp: assign.createdAt || 'Recent',
        priority: 'medium',
        read: readIds.includes(`assign-${assign.id}`),
        linkTab: 'staff-management',
        linkArgs: { assignmentId: assign.id, activeSubTab: 'assignments' }
      });
    });

    // 4. STUDENT SUBMISSIONS READY FOR STAFF DOWNLOAD & GRADING
    submissions.forEach((sub) => {
      if (sub.status === 'Pending') {
        list.push({
          id: `sub-${sub.id}`,
          type: 'assignment',
          title: `New Student Submission: ${sub.studentName}`,
          description: `${sub.studentName} (${sub.className}) submitted work for grading. File attached: ${sub.fileName || 'Online Answer Sheet'}.`,
          timestamp: sub.submittedAt || 'Recent',
          priority: 'high',
          read: readIds.includes(`sub-${sub.id}`),
          linkTab: 'staff-management',
          linkArgs: { submissionId: sub.id, activeSubTab: 'submissions' }
        });
      }
    });

    // Priority comparator: urgent (0) > high (1) > medium (2) > normal (3)
    const priorityWeight = {
      urgent: 0,
      high: 1,
      medium: 2,
      normal: 3,
    };

    return list.sort((a, b) => {
      // Unread first
      if (a.read !== b.read) {
        return a.read ? 1 : -1;
      }
      return priorityWeight[a.priority] - priorityWeight[b.priority];
    });
  }, [announcements, fees, students, assignments, submissions, readIds]);

  const unreadCount = useMemo(() => {
    return alerts.filter((a) => !a.read).length;
  }, [alerts]);

  const markAsRead = useCallback((id: string) => {
    setReadIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      try {
        localStorage.setItem('sma_read_notifications', JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
      return updated;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    const allIds = alerts.map((a) => a.id);
    setReadIds(allIds);
    try {
      localStorage.setItem('sma_read_notifications', JSON.stringify(allIds));
    } catch (err) {
      console.error(err);
    }
  }, [alerts]);

  const addAnnouncement = useCallback((newAnn: Omit<SchoolAnnouncement, 'id'>) => {
    const created: SchoolAnnouncement = {
      ...newAnn,
      id: `ann-${Date.now()}`
    };
    setAnnouncements((prev) => {
      const updated = [created, ...prev];
      try {
        localStorage.setItem('sma_announcements', JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
      window.dispatchEvent(new Event('storage'));
      return updated;
    });
    return created;
  }, []);

  const deleteAnnouncement = useCallback((id: string) => {
    setAnnouncements((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      try {
        localStorage.setItem('sma_announcements', JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
      window.dispatchEvent(new Event('storage'));
      return updated;
    });
  }, []);

  return {
    alerts,
    unreadCount,
    markAsRead,
    markAllAsRead,
    announcements,
    addAnnouncement,
    deleteAnnouncement,
  };
}
