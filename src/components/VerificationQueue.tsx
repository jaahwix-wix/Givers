/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  ShieldAlert, 
  CheckCircle, 
  Clock, 
  GraduationCap, 
  Briefcase, 
  ArrowRight, 
  Sparkles,
  ChevronRight,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { Student, Teacher } from '../types';
import { SCHOOL_INFO } from '../initialData';
import { syncFirestoreCollection, saveToFirestore, batchSaveToFirestore } from '../services/firestoreSync';

interface VerificationQueueProps {
  students: Student[];
  onUpdateStudent?: (student: Student) => void;
  onNavigate: (tab: string, arg?: any) => void;
}

export default function VerificationQueue({ students, onUpdateStudent, onNavigate }: VerificationQueueProps) {
  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const cached = localStorage.getItem('sma_teachers');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error('Failed to parse teachers', e);
      }
    }
    return [];
  });

  const [activeFilter, setActiveFilter] = useState<'all' | 'students' | 'staff'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync teachers from Firestore & storage
  useEffect(() => {
    const unsub = syncFirestoreCollection<Teacher>(
      'teachers',
      'sma_teachers',
      (items) => setTeachers(items)
    );
    return () => unsub();
  }, []);

  const unverifiedStudents = students.filter(s => s.status === 'Active' && !s.verified);
  const unverifiedTeachers = teachers.filter(t => !t.verified);
  const totalPending = unverifiedStudents.length + unverifiedTeachers.length;

  const handleVerifyStudent = (student: Student) => {
    const updated: Student = {
      ...student,
      verified: true,
      verifiedBy: `${SCHOOL_INFO.principalName} (Admin)`,
      verifiedAt: new Date().toISOString().split('T')[0]
    };

    if (onUpdateStudent) {
      onUpdateStudent(updated);
    } else {
      saveToFirestore('students', updated.id, updated);
      const allStudentsCached = localStorage.getItem('sma_students');
      if (allStudentsCached) {
        try {
          const list: Student[] = JSON.parse(allStudentsCached);
          const nextList = list.map(s => s.id === updated.id ? updated : s);
          localStorage.setItem('sma_students', JSON.stringify(nextList));
          window.dispatchEvent(new Event('storage'));
        } catch {
          // ignore
        }
      }
    }

    setToastMessage(`Student file for ${student.name} approved & verified.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleVerifyTeacher = (teacher: Teacher) => {
    const updated = teachers.map(t => t.id === teacher.id ? {
      ...t,
      verified: true,
      verifiedBy: `${SCHOOL_INFO.principalName} (Admin)`,
      verifiedAt: new Date().toISOString().split('T')[0]
    } : t);

    setTeachers(updated);
    try {
      localStorage.setItem('sma_teachers', JSON.stringify(updated));
    } catch {}
    saveToFirestore('teachers', teacher.id, {
      ...teacher,
      verified: true,
      verifiedBy: `${SCHOOL_INFO.principalName} (Admin)`,
      verifiedAt: new Date().toISOString().split('T')[0]
    });
    window.dispatchEvent(new Event('storage'));

    setToastMessage(`Staff account for ${teacher.name} approved & verified.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleVerifyAll = () => {
    if (totalPending === 0) return;

    // Verify all students
    unverifiedStudents.forEach(s => {
      handleVerifyStudent(s);
    });

    // Verify all teachers
    const updated = teachers.map(t => ({
      ...t,
      verified: true,
      verifiedBy: `${SCHOOL_INFO.principalName} (Admin)`,
      verifiedAt: new Date().toISOString().split('T')[0]
    }));
    setTeachers(updated);
    try {
      localStorage.setItem('sma_teachers', JSON.stringify(updated));
    } catch {}
    batchSaveToFirestore('teachers', updated);
    window.dispatchEvent(new Event('storage'));

    setToastMessage(`All ${totalPending} pending accounts verified by ${SCHOOL_INFO.principalName}.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-5 sm:p-6 space-y-4" id="admin-verification-queue-section">
      {/* Header with counter badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-200">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-slate-900 text-base">Administrative Verification Queue</h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-700" />
                {totalPending} {totalPending === 1 ? 'Pending Approval' : 'Pending Approvals'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Newly registered staff accounts and student files waiting for official Administrator sign-off
            </p>
          </div>
        </div>

        {totalPending > 0 && (
          <button
            type="button"
            onClick={handleVerifyAll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
            title="Approve and verify all pending accounts"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Approve All ({totalPending})</span>
          </button>
        )}
      </div>

      {/* Summary KPI Badges & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Pending ({totalPending})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('students')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeFilter === 'students'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Students ({unverifiedStudents.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('staff')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeFilter === 'staff'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Staff ({unverifiedTeachers.length})</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Authorizer: <span className="font-bold text-slate-800">{SCHOOL_INFO.principalName}</span>
        </div>
      </div>

      {/* Queue Items List */}
      {totalPending === 0 ? (
        <div className="py-8 px-4 text-center rounded-xl bg-emerald-50/60 border border-emerald-200 text-emerald-900 space-y-2">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h4 className="font-extrabold text-sm text-emerald-900">Verification Queue Clear</h4>
          <p className="text-xs text-emerald-700 max-w-md mx-auto">
            All registered student files and teaching staff profiles have been verified and approved by Administrator Evangelist Saint Turay.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Unverified Students */}
          {(activeFilter === 'all' || activeFilter === 'students') && unverifiedStudents.map(student => (
            <div 
              key={student.id} 
              className="p-3.5 rounded-xl bg-amber-50/40 border border-amber-200/80 hover:bg-amber-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                {student.profileImage ? (
                  <img
                    src={student.profileImage}
                    alt={student.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center shrink-0">
                    {student.name.split(' ').map(n => n[0]).join('')}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                      Student File
                    </span>
                    <span className="text-xs font-bold text-slate-900 truncate">{student.name}</span>
                    <span className="text-[10px] font-mono text-slate-500">({student.admissionNumber})</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {student.currentClass} {student.stream ? `• ${student.stream} stream` : ''} • Parent: {student.parentName} ({student.parentPhone})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => onNavigate('students', { studentId: student.id, search: student.name })}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors cursor-pointer"
                >
                  Inspect Profile
                </button>
                <button
                  type="button"
                  onClick={() => handleVerifyStudent(student)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Verify & Approve</span>
                </button>
              </div>
            </div>
          ))}

          {/* Unverified Teachers */}
          {(activeFilter === 'all' || activeFilter === 'staff') && unverifiedTeachers.map(teacher => (
            <div 
              key={teacher.id} 
              className="p-3.5 rounded-xl bg-purple-50/40 border border-purple-200/80 hover:bg-purple-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 font-bold text-sm flex items-center justify-center shrink-0">
                  {teacher.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                      Staff Member
                    </span>
                    <span className="text-xs font-bold text-slate-900 truncate">{teacher.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({teacher.email})</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    Subjects: {teacher.subjects.join(', ')} • Classes: {teacher.classes.join(', ')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => onNavigate('staff-management')}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors cursor-pointer"
                >
                  Inspect Staff
                </button>
                <button
                  type="button"
                  onClick={() => handleVerifyTeacher(teacher)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Verify & Approve</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-800 flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
