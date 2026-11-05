/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  User, 
  Award, 
  CreditCard, 
  LogOut, 
  Phone, 
  MapPin, 
  Calendar, 
  Heart, 
  ShieldAlert, 
  Printer, 
  FileText, 
  CheckCircle, 
  ArrowRight,
  TrendingUp,
  AlertCircle,
  ClipboardList,
  UploadCloud,
  X,
  QrCode,
  Bus,
  ScanLine,
  Download,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import QRCode from 'qrcode';
import { Student, StudentAcademicRecord, StudentFeeLedger, StudentClass } from '../types';
import { SCHOOL_INFO } from '../initialData';
import { getSubjectsForClass, calculateGrade, getGradingScale } from '../constants';
import PrincipalsNoticeBanner from './PrincipalsNoticeBanner';

interface StudentPortalProps {
  students: Student[];
  records: StudentAcademicRecord[];
  fees: StudentFeeLedger[];
}

export default function StudentPortal({ students, records, fees }: StudentPortalProps) {
  // Login State
  const [admissionInput, setAdmissionInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loggedInStudent, setLoggedInStudent] = useState<Student | null>(() => {
    const activeAdmission = localStorage.getItem('sma_active_portal_student');
    if (activeAdmission) {
      const clean = activeAdmission.trim().toUpperCase();
      const found = students.find(
        s => s.admissionNumber.trim().toUpperCase() === clean ||
             (s.studentAccessCode && s.studentAccessCode.trim().toUpperCase() === clean) ||
             (s.parentAccessCode && s.parentAccessCode.trim().toUpperCase() === clean)
      );
      if (found) return found;
    }
    return null;
  });

  // Re-synchronize logged-in student when Firestore collection delivers data
  useEffect(() => {
    if (!loggedInStudent && students.length > 0) {
      const activeAdmission = localStorage.getItem('sma_active_portal_student');
      if (activeAdmission) {
        const clean = activeAdmission.trim().toUpperCase();
        const found = students.find(
          s => s.admissionNumber.trim().toUpperCase() === clean ||
               (s.studentAccessCode && s.studentAccessCode.trim().toUpperCase() === clean) ||
               (s.parentAccessCode && s.parentAccessCode.trim().toUpperCase() === clean)
        );
        if (found) {
          setLoggedInStudent(found);
        }
      }
    } else if (loggedInStudent) {
      const fresh = students.find(s => s.id === loggedInStudent.id);
      if (fresh && fresh !== loggedInStudent) {
        setLoggedInStudent(fresh);
      }
    }
  }, [students, loggedInStudent]);
  
  // Active Tab inside Portal
  const [activeTab, setActiveTab] = useState<'overview' | 'academics' | 'financials' | 'assignments' | 'attendance_qr'>('overview');
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState<'All' | 'Pending' | 'Submitted' | 'Graded'>('All');
  
  // Attendance QR Code & Scanner State
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [scanSuccessMsg, setScanSuccessMsg] = useState<string | null>(null);
  const [scanLocation, setScanLocation] = useState<'School Bus Route #2 (Kambia)' | 'Classroom 6A Entrance' | 'School Main Gate'>('School Bus Route #2 (Kambia)');
  const [attendanceScanLogs, setAttendanceScanLogs] = useState<Array<{
    id: string;
    timestamp: string;
    location: string;
    method: string;
    status: 'Verified Present';
  }>>([
    {
      id: 'scan-init-1',
      timestamp: 'Today, 07:42 AM',
      location: 'School Bus Route #2 (Kambia Central)',
      method: 'Bus Conductor Handheld Scanner',
      status: 'Verified Present'
    },
    {
      id: 'scan-init-2',
      timestamp: 'Today, 08:05 AM',
      location: 'Main Academic Gate',
      method: 'Turnstile Optical Scanner',
      status: 'Verified Present'
    }
  ]);

  // Generate QR Code on student login
  useEffect(() => {
    if (loggedInStudent) {
      const payload = JSON.stringify({
        studentId: loggedInStudent.id,
        name: loggedInStudent.name,
        admissionNumber: loggedInStudent.admissionNumber,
        currentClass: loggedInStudent.currentClass,
        school: SCHOOL_INFO.name,
        passType: 'ATTENDANCE_VERIFIED',
        issuedDate: '2025/2026 Academic Session'
      });

      QRCode.toDataURL(payload, {
        width: 320,
        margin: 1.5,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      })
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error('Error generating attendance QR code:', err));
    }
  }, [loggedInStudent]);

  const handleSimulateScan = () => {
    if (!loggedInStudent) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newEntry = {
      id: `scan-${Date.now()}`,
      timestamp: `Today, ${now}`,
      location: scanLocation,
      method: 'Optical QR Scanner Device',
      status: 'Verified Present' as const
    };
    setAttendanceScanLogs(prev => [newEntry, ...prev]);
    setScanSuccessMsg(`Attendance Verified! ${loggedInStudent.name} checked in at ${scanLocation}.`);
    setTimeout(() => setScanSuccessMsg(null), 4000);
  };
  
  // Assignments and Submissions lists loaded from storage
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);

  // Submission modal form states
  const [submittingAssignmentId, setSubmittingAssignmentId] = useState<string | null>(null);
  const [textResponse, setTextResponse] = useState('');
  const [mockFileName, setMockFileName] = useState('');
  const [mockFileSize, setMockFileSize] = useState('');
  const [submissionFileData, setSubmissionFileData] = useState('');

  // Handle student file upload
  const handleStudentFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMockFileName(file.name);
    const sizeKb = Math.round(file.size / 1024);
    setMockFileSize(sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`);
    const reader = new FileReader();
    reader.onload = () => {
      setSubmissionFileData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Download Assignment Sheet / Material for Students
  const handleDownloadAssignmentSheet = (assign: any) => {
    if (assign.attachmentData) {
      const a = document.createElement('a');
      a.href = assign.attachmentData;
      a.download = assign.attachmentName || `${assign.title.replace(/\s+/g, '_')}_Worksheet.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const content = `========================================================================
${SCHOOL_INFO.name.toUpperCase()}
Principal: ${SCHOOL_INFO.principalName} (${SCHOOL_INFO.principalTitle})
COURSEWORK ASSIGNMENT SHEET
========================================================================
Title:         ${assign.title}
Subject:       ${assign.subject}
Class / Level: ${assign.className}
Educator:      ${assign.teacherName}
Date Assigned: ${assign.createdAt}
Due Deadline:  ${assign.dueDate}
Maximum Mark:  ${assign.maxPoints} Points
------------------------------------------------------------------------
ASSIGNMENT INSTRUCTIONS & QUESTIONS:
------------------------------------------------------------------------
${assign.description}

========================================================================
Submit your solutions via the Givers World Mission High School Student Portal.
========================================================================`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${assign.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Assignment.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Sync with LocalStorage
  useEffect(() => {
    const handleStorageUpdate = () => {
      const cachedAssignments = localStorage.getItem('sma_assignments');
      const cachedSubmissions = localStorage.getItem('sma_submissions');
      if (cachedAssignments) setAssignments(JSON.parse(cachedAssignments));
      if (cachedSubmissions) setSubmissions(JSON.parse(cachedSubmissions));
    };

    handleStorageUpdate();
    // Also listen to storage events to keep sync when tabs change
    window.addEventListener('storage', handleStorageUpdate);
    return () => window.removeEventListener('storage', handleStorageUpdate);
  }, [activeTab]);
  
  // Academics selector
  const [selectedTerm, setSelectedTerm] = useState<1 | 2 | 3>(3);
  
  // Login handler supporting Admission Number, Student Access Code, and Parent Access Code
  const handleLogin = (rawInput: string) => {
    const clean = rawInput.trim().toUpperCase();
    if (!clean) {
      setErrorMessage('Please enter your Student Admission Number or Parent Access Code.');
      return;
    }

    const found = students.find(
      s => s.admissionNumber.trim().toUpperCase() === clean ||
           (s.studentAccessCode && s.studentAccessCode.trim().toUpperCase() === clean) ||
           (s.parentAccessCode && s.parentAccessCode.trim().toUpperCase() === clean)
    );
    
    if (found) {
      if (found.status !== 'Active') {
        setErrorMessage('This student record is no longer active.');
        return;
      }
      localStorage.setItem('sma_active_portal_student', found.admissionNumber);
      setLoggedInStudent(found);
      setErrorMessage(null);
      setActiveTab('overview');
    } else {
      setErrorMessage('Access credential not recognized. Please enter a valid Admission Number or system-generated Parent Access Code.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sma_active_portal_student');
    setLoggedInStudent(null);
    setAdmissionInput('');
    setErrorMessage(null);
  };

  // If NOT logged in, show elegant Login Gate
  if (!loggedInStudent) {
    return (
      <div className="space-y-6">
        {/* Principal's Official Directive Banner */}
        <PrincipalsNoticeBanner variant="portal" />

        <div className="max-w-md mx-auto my-4 bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-md" id="student-portal-login-gate">
          <div className="flex h-1.5 w-full overflow-hidden rounded-full mb-6">
          <div className="bg-emerald-500 w-1/3"></div>
          <div className="bg-white w-1/3 border-y border-slate-100"></div>
          <div className="bg-blue-500 w-1/3"></div>
        </div>

        <div className="text-center space-y-2 mb-6">
          <img 
            src={SCHOOL_INFO.logo} 
            alt={`${SCHOOL_INFO.name} Logo`} 
            className="w-16 h-16 object-contain rounded-2xl bg-white p-1 border border-slate-200 shadow-sm mx-auto"
            referrerPolicy="no-referrer"
          />
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Student & Parent Portal</h2>
          <p className="text-xs text-slate-400">Enter your admission identifier or Parent Access Code</p>
        </div>

        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin(admissionInput);
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Admission Number or Parent Code</label>
            <input 
              type="text" 
              value={admissionInput}
              onChange={(e) => setAdmissionInput(e.target.value)}
              placeholder="e.g. GWM/2026/001 or PAR-3921"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-700 placeholder-slate-400 font-mono uppercase font-bold"
              required
            />
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-2 pt-1">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-sm cursor-pointer"
            >
              Access Portal <ArrowRight className="w-4 h-4" />
            </button>

            {/* Instant 1-Click Access Button (Only visible when students exist) */}
            {students.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const targetStudent = students[0];
                  if (targetStudent) {
                    localStorage.setItem('sma_active_portal_student', targetStudent.admissionNumber);
                    setLoggedInStudent(targetStudent);
                    setErrorMessage(null);
                    setActiveTab('overview');
                  }
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-xs transition-all cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>⚡ Instant 1-Click Access as Enrolled Student ({students[0].name})</span>
              </button>
            )}
          </div>
        </form>

        {/* Enrolled Student Keys Quick Selector (Only visible when students exist) */}
        {students.length > 0 ? (
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>Enrolled Students (Click to Enter):</span>
              </span>
              <span className="text-[10px] text-emerald-600 font-bold">Live Registry</span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {students.slice(0, 5).map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setAdmissionInput(s.admissionNumber);
                    handleLogin(s.admissionNumber);
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/40 text-left transition-colors flex items-center justify-between cursor-pointer group"
                >
                  <div>
                    <div className="font-bold text-xs text-slate-800 group-hover:text-emerald-700">
                      {s.name} <span className="text-[10px] text-slate-400 font-normal">({s.currentClass})</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>ID: <strong className="text-slate-700">{s.admissionNumber}</strong></span>
                      {s.parentAccessCode && (
                        <span>Parent Code: <strong className="text-emerald-700">{s.parentAccessCode}</strong></span>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] font-extrabold text-emerald-600 group-hover:translate-x-0.5 transition-transform">
                    Enter →
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-6 pt-5 border-t border-slate-100 text-center py-4">
            <p className="text-xs text-slate-400 font-medium">
              Live Database Mode: No registered students yet. Once students are admitted through the Student Records section, their credentials will activate automatically.
            </p>
          </div>
        )}

        {/* Institutional Privacy & Security Notice */}
        <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5 text-center">
            <div className="flex items-center justify-center gap-1.5 text-emerald-700 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Institutional Privacy Standards</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Student files and academic transcripts are confidential. Parents and guardians must enter their system-generated Parent Access Code (e.g. <span className="font-mono font-bold text-slate-700">PAR-XXXX</span>) issued by the registry upon enrollment.
            </p>
          </div>
        </div>
      </div>
      </div>
    );
  }

  // Loaded Profile and Records
  const student = loggedInStudent;
  const academicRecord = records.find(r => r.studentId === student.id);
  const feeLedger = fees.find(f => f.studentId === student.id);

  // Term Calculations
  const termData = academicRecord?.terms?.[selectedTerm];
  const grades = termData?.grades || [];
  const totalScoreSum = grades.reduce((sum, g) => sum + g.totalScore, 0);
  const averageScore = grades.length > 0 ? Math.round(totalScoreSum / grades.length) : 0;

  // Print single Term Report Helper
  const handlePrintPortalReport = () => {
    window.print();
  };

  // Student Assignment Counts for Badges & Progress
  const studentClassAssignments = assignments.filter(a => a.className === student.currentClass);
  const studentPendingCount = studentClassAssignments.filter(
    a => !submissions.some(s => s.assignmentId === a.id && s.studentId === student.id)
  ).length;

  return (
    <div className="space-y-6" id="student-portal-dashboard">
      {/* Principal's Official Pinned Announcement */}
      <PrincipalsNoticeBanner variant="portal" />

      {/* 1. Portal Top banner */}
      <div className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg border border-slate-800">
        {/* Flag background ribbon */}
        <div className="flex h-1 w-full overflow-hidden absolute top-0 left-0">
          <div className="bg-emerald-500 w-1/3"></div>
          <div className="bg-white w-1/3"></div>
          <div className="bg-blue-500 w-1/3"></div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            {student.profileImage ? (
              <img
                src={student.profileImage}
                alt={student.name}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-2xl object-cover border border-slate-700 shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl border border-indigo-500 shadow-md">
                {student.name.split(' ').map(n => n[0]).join('')}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-indigo-400 border border-slate-700 font-mono">
                  {student.admissionNumber}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900">
                  Student Account
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-tight mt-1">{student.name}</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Current Level: <span className="font-bold text-white">{student.currentClass}</span>
                {student.universityProgram && (
                  <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                    {student.universityProgram} Program
                  </span>
                )}
                {student.stream && !student.universityProgram ? ` (${student.stream} Stream)` : ''}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="self-start md:self-auto flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 font-semibold text-xs transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </div>

      {/* 2. Portal Sub-tabs */}
      <div className="flex border-b border-slate-200" id="portal-tabs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <User className="w-4 h-4" /> Personal Profile
        </button>
        <button
          onClick={() => setActiveTab('academics')}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'academics'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Award className="w-4 h-4" /> Report Cards
        </button>
        <button
          onClick={() => setActiveTab('financials')}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'financials'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <CreditCard className="w-4 h-4" /> Tuition & Fees
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'assignments'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <ClipboardList className="w-4 h-4" /> My Assignments
          {studentPendingCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200">
              {studentPendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('attendance_qr')}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'attendance_qr'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <QrCode className="w-4 h-4" /> Attendance QR Pass
        </button>
      </div>

      {/* 3. Portal Tab Render Content */}
      <div className="space-y-6">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="portal-overview-pane">
            {/* Left Col: Biographic details */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 space-y-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 border-b border-slate-50 pb-3">Biographical Profile</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Full Name</span>
                    <span className="font-bold text-slate-700">{student.name}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Admission Number</span>
                    <span className="font-bold text-slate-700 font-mono">{student.admissionNumber}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Date of Birth</span>
                    <span className="font-bold text-slate-700">{student.dateOfBirth}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Home Address</span>
                    <span className="font-bold text-slate-700">{student.address}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Parent / Guardian Name</span>
                    <span className="font-bold text-slate-700">{student.parentName}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Parent Contact Phone</span>
                    <span className="font-bold text-slate-700">{student.parentPhone}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Medical details */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800 border-b border-slate-50 pb-3 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500" /> Medical Summary
                </h3>
                
                <div className="mt-4 space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1 bg-rose-50 border border-rose-100 rounded-xl p-3 text-center">
                      <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wider block">Blood Group</span>
                      <span className="text-2xl font-black text-rose-700">{student.bloodType || 'N/A'}</span>
                    </div>

                    <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Allergies</span>
                      <p className="text-xs font-bold text-slate-700 line-clamp-2">
                        {student.allergies && student.allergies.trim().toLowerCase() !== 'none' && student.allergies.trim() !== ''
                          ? student.allergies 
                          : 'No documented allergies'}
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50/50 border border-slate-100 rounded-xl space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Assigned Emergency Contact
                    </span>
                    {student.emergencyContactName ? (
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between items-center font-bold text-slate-700">
                          <span>{student.emergencyContactName}</span>
                          <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">
                            {student.emergencyContactRelation || 'Contact'}
                          </span>
                        </div>
                        <p className="text-slate-500 flex items-center gap-1.5 font-mono">
                          <Phone className="w-3.5 h-3.5 text-slate-400" /> {student.emergencyContactPhone || 'No contact phone'}
                        </p>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic">
                        No specific contact designated. Primary contact: {student.parentPhone} ({student.parentName})
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-indigo-600 bg-indigo-50/50 rounded-xl p-3 text-center font-bold">
                🔒 Keep your emergency details up-to-date with the School Administration registrar.
              </div>
            </div>

            {/* Bottom Row: Quick Attendance Pass Banner */}
            <div className="lg:col-span-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm border border-slate-800">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-2xl border border-white/15 text-indigo-300 shrink-0">
                  <QrCode className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm md:text-base text-white">Digital Attendance & Bus Scanner QR Pass</h4>
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Active Pass</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl">
                    Unique optical pass for {student.name} ({student.admissionNumber}). Use this QR code for instant check-in when boarding the school bus or entering classrooms.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('attendance_qr')}
                className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <ScanLine className="w-4 h-4" />
                <span>Open Full QR Attendance Pass</span>
              </button>
            </div>
          </div>
        )}

        {/* ACADEMICS TAB */}
        {activeTab === 'academics' && (
          <div className="space-y-6" id="portal-academics-pane">
            {/* Filter Bar inside tab */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Academic Term:</span>
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(parseInt(e.target.value) as any)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="1">Term 1 Record</option>
                  <option value="2">Term 2 Record</option>
                  <option value="3">Term 3 Record (Final)</option>
                </select>
              </div>

              <button 
                onClick={handlePrintPortalReport}
                className="flex items-center justify-center gap-1.5 py-1.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Print Term Report Card
              </button>
            </div>

            {academicRecord && termData ? (
              <div className="bg-white border-2 border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-md max-w-4xl mx-auto print:border-none print:shadow-none print:p-0">
                {/* Sierra Leone Flag colors header */}
                <div className="flex h-1.5 w-full overflow-hidden rounded-full">
                  <div className="bg-emerald-500 w-1/3"></div>
                  <div className="bg-white w-1/3 border-y border-slate-100"></div>
                  <div className="bg-blue-500 w-1/3"></div>
                </div>

                {/* Report Card Header */}
                <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left border-b-2 border-slate-800 pb-5 gap-4">
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 flex flex-col items-center justify-center text-white border-2 border-slate-800 font-bold shrink-0 relative overflow-hidden">
                      <span className="text-[10px] tracking-tight text-indigo-400 font-mono">NS</span>
                      <span className="text-[8px] text-slate-400 font-sans uppercase">Portal</span>
                    </div>
                    
                    <div className="space-y-1">
                      <h1 className="text-lg md:text-xl font-black text-slate-800 tracking-tight font-sans uppercase">{SCHOOL_INFO.name}</h1>
                      <p className="text-[10px] font-bold text-indigo-600 italic">" {SCHOOL_INFO.motto} "</p>
                      <p className="text-[10px] text-slate-500 font-medium">Phone: {SCHOOL_INFO.phone} | Email: {SCHOOL_INFO.email} | Web: {SCHOOL_INFO.website}</p>
                    </div>
                  </div>

                  <div className="text-center md:text-right md:shrink-0">
                    <span className="inline-block px-2.5 py-1 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-md border border-slate-900">
                      Academic Term Report
                    </span>
                    <p className="text-xs font-bold text-slate-700 mt-2">Academic Year: {academicRecord.academicYear}</p>
                    <p className="text-xs font-bold text-indigo-600">Term {selectedTerm} Terminal Assessment</p>
                  </div>
                </div>

                {/* Profile row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 text-xs font-medium text-slate-600">
                  <div>
                    <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Student Name</p>
                    <p className="font-bold text-slate-800 text-sm truncate">{student.name}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Admission ID</p>
                    <p className="font-bold text-slate-800 font-mono">{student.admissionNumber}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Class Grade</p>
                    <p className="font-bold text-slate-800">{student.currentClass} {student.stream ? `(${student.stream})` : ''}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Attendance</p>
                    <p className="font-bold text-slate-800">
                      {termData.attendance?.presentDays || 0} / {termData.attendance?.totalDays || 0} Days
                    </p>
                  </div>
                </div>

                {/* Subject Grades Table */}
                {grades.length > 0 ? (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                        <tr>
                          <th className="py-3 px-4">Subject</th>
                          <th className="py-3 px-3 text-center">CA Score (40)</th>
                          <th className="py-3 px-3 text-center">Exam (60)</th>
                          <th className="py-3 px-3 text-center">Total (100)</th>
                          <th className="py-3 px-3 text-center">Grade</th>
                          <th className="py-3 px-4">Remark</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {grades.map((gradeRow) => (
                          <tr key={gradeRow.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4 font-bold text-slate-900">{gradeRow.subject}</td>
                            <td className="py-3 px-3 text-center font-mono">{gradeRow.caScore}</td>
                            <td className="py-3 px-3 text-center font-mono">{gradeRow.examScore}</td>
                            <td className="py-3 px-3 text-center font-bold text-slate-900 font-mono">{gradeRow.totalScore}</td>
                            <td className="py-3 px-3 text-center">
                              <span className={`inline-block font-black px-2 py-0.5 rounded text-[11px] ${
                                ['A', 'A1', 'B2', 'B3'].some(g => (gradeRow.grade || '').startsWith(g))
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : (gradeRow.grade === 'F9' || gradeRow.grade === 'E' ? 'bg-rose-50 text-rose-700' : 'bg-indigo-50 text-indigo-700')
                              }`}>
                                {gradeRow.grade}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-xs font-semibold">{gradeRow.remark}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-semibold">Assessment grades pending for Term {selectedTerm}</p>
                    <p className="text-[10px] text-slate-400">Grades are published at the end of each assessment cycle.</p>
                  </div>
                )}

                {/* Bottom Comments / Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-4 border-t border-slate-200 text-xs">
                  {/* Summary performance numbers */}
                  <div className="md:col-span-4 bg-slate-50 rounded-2xl p-4 space-y-3 flex flex-col justify-center">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average Terminal Score</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-2xl font-black text-slate-800">{averageScore}%</span>
                        <span className="text-xs text-slate-400">/ 100%</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Conduct Grade</span>
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded mt-1 inline-block">
                        {termData.conduct || 'Excellent'}
                      </span>
                    </div>
                  </div>

                  {/* Teacher Comments */}
                  <div className="md:col-span-8 space-y-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Class Teacher Remarks</span>
                      <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl font-semibold italic text-slate-600">
                        "{termData.teacherRemarks || 'A great performance. Continue to focus on core technical papers next term.'}"
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Principal remarks</span>
                      <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl font-semibold italic text-slate-600">
                        "{termData.principalRemarks || 'Approved. Exceptional dedication to self-improvement.'}"
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer seal */}
                <div className="flex justify-between items-end pt-8 border-t border-slate-100 text-[10px] text-slate-400">
                  <div>
                    <p>Generated via Student Access Portal</p>
                    <p className="font-mono mt-0.5">Hash Code: SMA-{student.id}-{selectedTerm}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-700">{SCHOOL_INFO.principalName}</p>
                    <p className="italic">School Principal Seal & Signature</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <Award className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                <p className="text-sm font-semibold text-slate-600">No Academic Records Found</p>
                <p className="text-xs text-slate-400 mt-1">Please ask your administrator to register your academic profiles.</p>
              </div>
            )}
          </div>
        )}

        {/* FINANCIALS TAB */}
        {activeTab === 'financials' && (
          <div className="space-y-6" id="portal-financials-pane">
            {feeLedger ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Side: Summary and term blocks */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tuition Account Summary</h4>
                    
                    {[1, 2, 3].map((termNum) => {
                      const tData = feeLedger?.terms?.[termNum];
                      if (!tData) return null;
                      
                      const badgeStyles = {
                        Paid: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                        Partial: 'bg-amber-50 text-amber-700 border-amber-100',
                        Unpaid: 'bg-rose-50 text-rose-700 border-rose-100'
                      };

                      return (
                        <div key={termNum} className="p-3.5 bg-slate-50/60 border border-slate-100 rounded-xl space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-800">Term {termNum} Tuition</span>
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${badgeStyles[tData.status] || badgeStyles.Unpaid}`}>
                              {tData.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-1 text-center font-mono text-xs pt-1.5 border-t border-slate-200/50">
                            <div>
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Due</span>
                              <span className="font-bold text-slate-700">SLL {tData.totalDue}</span>
                            </div>
                            <div>
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Paid</span>
                              <span className="font-bold text-emerald-600">SLL {tData.paidAmount}</span>
                            </div>
                            <div>
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Balance</span>
                              <span className={`font-extrabold ${tData.balance > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                                SLL {tData.balance}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Side: Transactions History */}
                <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" /> Payment Transaction Receipts
                  </h4>

                  {/* Extract all transactions across terms */}
                  {(() => {
                    const allTx: Array<{ term: number; id: string; amount: number; date: string; paymentMethod: string; receiptNumber: string }> = [];
                    [1, 2, 3].forEach(tNum => {
                      const termData = feeLedger?.terms?.[tNum];
                      if (termData?.transactions) {
                        termData.transactions.forEach(tx => {
                          allTx.push({ ...tx, term: tNum });
                        });
                      }
                    });

                    // Sort newest transactions first
                    allTx.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                    if (allTx.length === 0) {
                      return (
                        <div className="py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                          <CreditCard className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                          <p className="text-xs font-semibold">No transactions recorded yet</p>
                          <p className="text-[10px] text-slate-400">Payments registered by bank draft or office cashier will appear here.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-bold text-[9px] tracking-wider">
                            <tr>
                              <th className="py-3 px-4">Receipt ID</th>
                              <th className="py-3 px-3">Date</th>
                              <th className="py-3 px-3">Term</th>
                              <th className="py-3 px-3">Method</th>
                              <th className="py-3 px-3 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {allTx.map((tx) => (
                              <tr key={tx.id} className="hover:bg-slate-50/50">
                                <td className="py-3 px-4 font-mono font-bold text-indigo-600">{tx.receiptNumber || tx.id}</td>
                                <td className="py-3 px-3 font-mono text-[11px]">{tx.date}</td>
                                <td className="py-3 px-3">
                                  <span className="font-bold bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                                    Term {tx.term}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-slate-500">{tx.paymentMethod}</td>
                                <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono">SLL {tx.amount}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>

              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <CreditCard className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                <p className="text-sm font-semibold text-slate-600">No Fee Ledgers Found</p>
                <p className="text-xs text-slate-400 mt-1">Please ask your finance officer to initialize tuition accounts.</p>
              </div>
            )}
          </div>
        )}

        {/* MY ASSIGNMENTS TAB */}
        {activeTab === 'assignments' && (
          <div className="space-y-6" id="portal-assignments-pane">
            {(() => {
              const classAssignments = assignments.filter(a => a.className === student.currentClass);
              const totalClassAssignments = classAssignments.length;
              
              const completedAssignments = classAssignments.filter(a => {
                const sub = submissions.find(s => s.assignmentId === a.id && s.studentId === student.id);
                return sub?.status === 'Graded';
              });
              const submittedAssignments = classAssignments.filter(a => {
                const sub = submissions.find(s => s.assignmentId === a.id && s.studentId === student.id);
                return sub && sub.status !== 'Graded';
              });
              const pendingAssignments = classAssignments.filter(a => {
                return !submissions.some(s => s.assignmentId === a.id && s.studentId === student.id);
              });

              const completedCount = completedAssignments.length;
              const submittedCount = submittedAssignments.length;
              const pendingCount = pendingAssignments.length;
              const completionPercentage = totalClassAssignments > 0 
                ? Math.round(((completedCount) / totalClassAssignments) * 100) 
                : 0;

              // Filter list
              const displayAssignments = classAssignments.filter(assign => {
                const sub = submissions.find(s => s.assignmentId === assign.id && s.studentId === student.id);
                if (assignmentStatusFilter === 'Pending') return !sub;
                if (assignmentStatusFilter === 'Submitted') return sub && sub.status !== 'Graded';
                if (assignmentStatusFilter === 'Graded') return sub?.status === 'Graded';
                return true;
              });

              return (
                <div className="space-y-6">
                  {/* Coursework Progress & Statistics Card */}
                  <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                          <ClipboardList className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-800 text-base">My Assignments & Homework Progress</h3>
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {student.currentClass}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Track your submission statuses, score remarks, and active coursework deadlines
                          </p>
                        </div>
                      </div>

                      {/* Coursework completion badge */}
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="text-xs font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>{completedCount} of {totalClassAssignments} Completed</span>
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-slate-700">Coursework Completion Rate</span>
                        <span className="font-bold text-indigo-600">{completionPercentage}%</span>
                      </div>
                      <div className="w-full bg-slate-200/80 h-3 rounded-full overflow-hidden flex">
                        {/* Completed portion (Emerald) */}
                        <div 
                          className="bg-emerald-500 h-full transition-all duration-500" 
                          style={{ width: `${totalClassAssignments > 0 ? (completedCount / totalClassAssignments) * 100 : 0}%` }}
                          title={`Completed: ${completedCount}`}
                        />
                        {/* Submitted portion (Amber) */}
                        <div 
                          className="bg-amber-400 h-full transition-all duration-500" 
                          style={{ width: `${totalClassAssignments > 0 ? (submittedCount / totalClassAssignments) * 100 : 0}%` }}
                          title={`Under Review: ${submittedCount}`}
                        />
                      </div>
                      <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Graded Completed
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-400"></span> Submitted (Under Review)
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-400"></span> Pending Action
                        </span>
                      </div>
                    </div>

                    {/* 4 Status Indicator Metric Pills */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* Total */}
                      <button 
                        type="button"
                        onClick={() => setAssignmentStatusFilter('All')}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          assignmentStatusFilter === 'All'
                            ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-200'
                            : 'bg-white border-slate-200/80 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
                          <span>All Assigned</span>
                          <ClipboardList className="w-4 h-4 text-indigo-500" />
                        </div>
                        <p className="text-2xl font-black text-slate-800 mt-1">{totalClassAssignments}</p>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Total curriculum tasks</span>
                      </button>

                      {/* Pending Action */}
                      <button 
                        type="button"
                        onClick={() => setAssignmentStatusFilter('Pending')}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          assignmentStatusFilter === 'Pending'
                            ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-200'
                            : 'bg-white border-slate-200/80 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex justify-between items-center text-xs text-rose-600 font-bold">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                            Pending Action
                          </span>
                          <AlertCircle className="w-4 h-4 text-rose-500" />
                        </div>
                        <p className="text-2xl font-black text-rose-700 mt-1">{pendingCount}</p>
                        <span className="text-[10px] text-rose-500 block mt-0.5">Requires submission</span>
                      </button>

                      {/* Submitted (In Review) */}
                      <button 
                        type="button"
                        onClick={() => setAssignmentStatusFilter('Submitted')}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          assignmentStatusFilter === 'Submitted'
                            ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-200'
                            : 'bg-white border-slate-200/80 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex justify-between items-center text-xs text-amber-700 font-bold">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                            In Review
                          </span>
                          <Clock className="w-4 h-4 text-amber-500" />
                        </div>
                        <p className="text-2xl font-black text-amber-700 mt-1">{submittedCount}</p>
                        <span className="text-[10px] text-amber-600 block mt-0.5">Awaiting teacher grading</span>
                      </button>

                      {/* Completed / Graded */}
                      <button 
                        type="button"
                        onClick={() => setAssignmentStatusFilter('Graded')}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          assignmentStatusFilter === 'Graded'
                            ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200'
                            : 'bg-white border-slate-200/80 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex justify-between items-center text-xs text-emerald-700 font-bold">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Completed
                          </span>
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                        <p className="text-2xl font-black text-emerald-700 mt-1">{completedCount}</p>
                        <span className="text-[10px] text-emerald-600 block mt-0.5">Graded with feedback</span>
                      </button>
                    </div>

                    {/* Filter Pills Bar */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto text-xs font-bold">
                      <span className="text-slate-400 uppercase tracking-wider text-[10px]">Filter View:</span>
                      {(['All', 'Pending', 'Submitted', 'Graded'] as const).map((filterVal) => (
                        <button
                          key={filterVal}
                          onClick={() => setAssignmentStatusFilter(filterVal)}
                          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer text-xs ${
                            assignmentStatusFilter === filterVal
                              ? 'bg-slate-900 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {filterVal === 'All' ? `All Tasks (${totalClassAssignments})` : 
                           filterVal === 'Pending' ? `Pending (${pendingCount})` : 
                           filterVal === 'Submitted' ? `Submitted (${submittedCount})` : 
                           `Completed (${completedCount})`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* List of Assignment Cards */}
                  {displayAssignments.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200/90 py-16 text-center text-slate-400">
                      <ClipboardList className="w-12 h-12 mx-auto text-slate-200 mb-3" />
                      <h4 className="text-sm font-bold text-slate-700">No Assignments In This Filter</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        There are no homework tasks currently matching the selected filter state ({assignmentStatusFilter}).
                      </p>
                      <button 
                        onClick={() => setAssignmentStatusFilter('All')}
                        className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Reset To All Tasks
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {displayAssignments.map(assign => {
                        const studentSubmission = submissions.find(
                          s => s.assignmentId === assign.id && s.studentId === student.id
                        );

                        // Determine status type for styling
                        const isGraded = studentSubmission?.status === 'Graded';
                        const isSubmitted = studentSubmission && !isGraded;
                        const isPending = !studentSubmission;

                        return (
                          <div 
                            key={assign.id} 
                            className={`p-5 rounded-3xl border transition-all flex flex-col justify-between shadow-2xs ${
                              isGraded 
                                ? 'bg-gradient-to-br from-emerald-50/40 via-white to-white border-emerald-200/90 hover:border-emerald-300' 
                                : isSubmitted 
                                ? 'bg-gradient-to-br from-amber-50/40 via-white to-white border-amber-200/90 hover:border-amber-300' 
                                : 'bg-gradient-to-br from-rose-50/30 via-white to-white border-rose-200/90 hover:border-rose-300'
                            }`}
                          >
                            <div className="space-y-3.5">
                              {/* Header & Status Indicator */}
                              <div className="flex justify-between items-start gap-3">
                                <div>
                                  <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg border border-slate-200 font-mono">
                                    {assign.subject}
                                  </span>
                                  <h4 className="font-bold text-slate-900 text-sm mt-1.5 leading-snug">{assign.title}</h4>
                                  <span className="text-[11px] text-slate-500 block mt-0.5">Educator: <strong>{assign.teacherName}</strong></span>
                                </div>

                                {/* Status Color Indicator Badge */}
                                <div className="shrink-0">
                                  {isGraded ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
                                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Completed</span>
                                    </span>
                                  ) : isSubmitted ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs">
                                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                                      <span>Submitted</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 shadow-2xs">
                                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                      <span>Pending Action</span>
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Task Description */}
                              <p className="text-xs text-slate-600 leading-relaxed font-normal bg-white/70 p-3 rounded-2xl border border-slate-100">
                                {assign.description}
                              </p>

                              {assign.attachmentName && (
                                <div className="flex items-center gap-2 text-[11px] text-indigo-700 bg-indigo-50/80 px-3 py-1.5 rounded-xl border border-indigo-100 font-mono">
                                  <span>Attached Sheet: <strong>{assign.attachmentName}</strong></span>
                                </div>
                              )}
                            </div>

                            {/* Footer / Submission Details */}
                            <div className="pt-4 mt-4 border-t border-slate-100 space-y-3">
                              <div className="flex justify-between items-center text-xs font-medium">
                                <span className="text-slate-500 font-mono text-[11px]">Max Mark: <strong>{assign.maxPoints} pts</strong></span>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadAssignmentSheet(assign)}
                                    className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-200 transition-colors shadow-2xs cursor-pointer"
                                    title="Download Worksheet Assignment"
                                  >
                                    <Download className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>Download Sheet</span>
                                  </button>
                                  <span className="text-rose-600 font-bold text-[11px]">Due: {assign.dueDate}</span>
                                </div>
                              </div>

                              {/* If Student Submitted */}
                              {studentSubmission ? (
                                <div className="p-3.5 bg-white border border-slate-200/80 rounded-2xl space-y-2.5 text-xs shadow-2xs">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                                      Your Submission ({studentSubmission.submittedAt})
                                    </span>
                                    {isGraded && (
                                      <span className="px-2 py-0.5 rounded-md font-bold text-xs bg-emerald-100 text-emerald-800 border border-emerald-200">
                                        Score: {studentSubmission.score}/{assign.maxPoints} ({Math.round(((studentSubmission.score || 0) / assign.maxPoints) * 100)}%)
                                      </span>
                                    )}
                                  </div>

                                  <p className="text-slate-700 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                                    "{studentSubmission.textResponse}"
                                  </p>

                                  {studentSubmission.fileName && (
                                    <span className="inline-block font-mono text-indigo-600 text-[10px] bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">
                                      📎 {studentSubmission.fileName} ({studentSubmission.fileSize})
                                    </span>
                                  )}

                                  {isGraded && studentSubmission.feedback && (
                                    <div className="pt-2 border-t border-slate-100 text-xs text-emerald-900 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                                      <span className="font-bold block text-emerald-800">Teacher Evaluation Feedback:</span>
                                      <p className="italic mt-0.5 text-[11px]">{studentSubmission.feedback}</p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSubmittingAssignmentId(assign.id);
                                    setTextResponse('');
                                    setMockFileName('completed_assignment.pdf');
                                    setMockFileSize('350 KB');
                                    setSubmissionFileData('');
                                  }}
                                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs cursor-pointer transition-all shadow-xs"
                                >
                                  <UploadCloud className="w-4 h-4" /> Upload & Submit Assignment
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ASSIGNMENT UPLOAD MODAL */}
            {submittingAssignmentId && (
              <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl w-full max-w-md shadow-xl border border-slate-100 overflow-hidden text-left">
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                      <UploadCloud className="w-5 h-5 text-indigo-600" /> Submit Homework Assignment
                    </h4>
                    <button 
                      onClick={() => setSubmittingAssignmentId(null)}
                      className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 transition-colors cursor-pointer"
                    >
                      <X className="w-4.5 h-4.5" />
                    </button>
                  </div>

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const newSub = {
                        id: `sub-${Date.now()}`,
                        assignmentId: submittingAssignmentId,
                        studentId: student.id,
                        studentName: student.name,
                        className: student.currentClass,
                        submittedAt: new Date().toISOString().substring(0, 16).replace('T', ' '),
                        textResponse: textResponse,
                        fileName: mockFileName || "completed_sheet.pdf",
                        fileSize: mockFileSize || "310 KB",
                        fileData: submissionFileData || undefined,
                        status: 'Pending'
                      };

                      const updated = [...submissions, newSub];
                      setSubmissions(updated);
                      localStorage.setItem('sma_submissions', JSON.stringify(updated));
                      window.dispatchEvent(new Event('storage'));
                      setSubmittingAssignmentId(null);
                    }}
                    className="p-5 space-y-4"
                  >
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Write Submission Text / Explanations</label>
                      <textarea
                        required
                        rows={4}
                        value={textResponse}
                        onChange={(e) => setTextResponse(e.target.value)}
                        placeholder="Type down your completion remarks, step-by-step answers or reference notes..."
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 text-slate-700 leading-normal"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Attach Completed Document / File</label>
                      
                      {/* Real File Upload with Drag & Drop styling */}
                      <div className="border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-2xl p-4 text-center cursor-pointer bg-slate-50/50 transition-colors relative">
                        <input
                          type="file"
                          id="student-work-upload-input"
                          onChange={handleStudentFileUpload}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                        />
                        <label htmlFor="student-work-upload-input" className="cursor-pointer block">
                          <UploadCloud className="w-8 h-8 text-indigo-500 mx-auto mb-1.5" />
                          <span className="text-xs font-bold text-slate-700 block">Click to select file or drag & drop here</span>
                          <span className="text-[10px] text-slate-400 mt-0.5 block">Supports PDF, DOCX, TXT, PNG, JPG</span>
                        </label>

                        <div className="mt-3 bg-white border border-slate-100 p-2 rounded-xl flex items-center justify-between text-xs font-medium max-w-xs mx-auto">
                          <input
                            type="text"
                            value={mockFileName}
                            onChange={(e) => setMockFileName(e.target.value)}
                            placeholder="File Name"
                            className="bg-transparent border-none font-mono text-[10px] text-indigo-600 focus:outline-none flex-1 truncate"
                            required
                          />
                          <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded shrink-0 ml-1">
                            {mockFileSize}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                      >
                        Submit Assignment
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubmittingAssignmentId(null)}
                        className="py-2 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ATTENDANCE QR CODE PASS TAB */}
        {activeTab === 'attendance_qr' && (
          <div className="space-y-6" id="portal-attendance-qr-pane">
            {/* Scan Feedback Banner */}
            {scanSuccessMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-bold shadow-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{scanSuccessMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Col: The Digital Attendance Pass */}
              <div className="lg:col-span-6 flex flex-col items-center">
                <div 
                  id="student-qr-pass-card"
                  className="w-full max-w-md bg-white rounded-3xl border-2 border-indigo-200 shadow-xl overflow-hidden relative"
                >
                  {/* Sierra Leone National Ribbon */}
                  <div className="flex h-2 w-full overflow-hidden">
                    <div className="bg-emerald-500 w-1/3"></div>
                    <div className="bg-white w-1/3"></div>
                    <div className="bg-blue-500 w-1/3"></div>
                  </div>

                  {/* Header */}
                  <div className="bg-slate-900 text-white p-5 text-center relative">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 mb-1.5">
                      <Bus className="w-3 h-3" /> Digital Attendance Pass
                    </div>
                    <h3 className="font-bold text-base tracking-wide uppercase">{SCHOOL_INFO.name}</h3>
                    <p className="text-[11px] text-indigo-300 italic">"{SCHOOL_INFO.motto}" • Kambia 2, Sierra Leone</p>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 flex flex-col items-center text-center space-y-4">
                    {/* Student Info */}
                    <div className="flex items-center gap-3">
                      {student.profileImage ? (
                        <img 
                          src={student.profileImage} 
                          alt={student.name}
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-100 shadow-sm"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-700 font-black text-2xl flex items-center justify-center border-2 border-indigo-200 shadow-sm">
                          {student.name.charAt(0)}
                        </div>
                      )}
                      <div className="text-left">
                        <h4 className="text-lg font-black text-slate-900 leading-tight">{student.name}</h4>
                        <div className="inline-flex items-center gap-2 mt-1">
                          <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            {student.admissionNumber}
                          </span>
                          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            {student.currentClass}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* QR Code Container */}
                    <div className="p-4 bg-white rounded-2xl border-2 border-slate-900/10 shadow-sm flex flex-col items-center">
                      {qrCodeUrl ? (
                        <img 
                          src={qrCodeUrl} 
                          alt={`Attendance QR Code for ${student.name}`}
                          className="w-52 h-52 object-contain"
                        />
                      ) : (
                        <div className="w-52 h-52 flex items-center justify-center text-xs text-slate-400">
                          Generating QR Pass...
                        </div>
                      )}
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                        <ScanLine className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Optical Attendance Token ID: {student.id.slice(0, 8)}</span>
                      </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="w-full grid grid-cols-2 gap-2 text-left bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Guardian Phone</span>
                        <span className="font-semibold text-slate-800">{student.parentPhone}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Blood Group</span>
                        <span className="font-black text-rose-600">{student.bloodType || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Principal Sign-off */}
                    <div className="w-full pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                      <span>CEO/Principal: Evangelist Saint Turay</span>
                      <span>Telephone: +232 74155000</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="w-full max-w-md flex gap-2 mt-4">
                  {qrCodeUrl && (
                    <a
                      href={qrCodeUrl}
                      download={`attendance-qr-${student.admissionNumber}.png`}
                      className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download QR Image</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Pass</span>
                  </button>
                </div>
              </div>

              {/* Right Col: Bus & Classroom Scanner Simulation */}
              <div className="lg:col-span-6 space-y-5">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
                      <ScanLine className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">Attendance Scanner Station</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Simulate quick scanner hardware check-in for the school bus and classroom
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-700">
                      Select Scanner Terminal / Station:
                    </label>
                    <select
                      value={scanLocation}
                      onChange={(e) => setScanLocation(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="School Bus Route #2 (Kambia)">🚌 School Bus Route #2 (Kambia Central)</option>
                      <option value="Classroom 6A Entrance">🏫 Classroom 6A Main Entrance</option>
                      <option value="School Main Gate">🚪 Campus Main Academic Gate</option>
                    </select>

                    <button
                      type="button"
                      onClick={handleSimulateScan}
                      className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <QrCode className="w-4 h-4 text-indigo-400" />
                      <span>Simulate Optical Scan Check-In</span>
                    </button>
                  </div>

                  <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <Bus className="w-4 h-4 text-indigo-600" />
                      <span>How attendance tracking works:</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      1. Students show this digital pass on their phone or as a printed badge card.<br />
                      2. The bus conductor or homeroom teacher scans the QR code with their mobile phone or handheld laser scanner.<br />
                      3. Attendance status is instantly recorded and synced with the school administration registry.
                    </p>
                  </div>
                </div>

                {/* Scan History Log */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="text-sm font-bold text-slate-900">Recent Attendance Check-in Logs</h4>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Live Verification</span>
                  </div>

                  <div className="space-y-2.5">
                    {attendanceScanLogs.map((log) => (
                      <div 
                        key={log.id} 
                        className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 truncate">{log.location}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>{log.timestamp}</span>
                            <span>•</span>
                            <span>{log.method}</span>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {log.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
