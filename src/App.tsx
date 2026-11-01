/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Award, 
  CreditCard, 
  Database, 
  Menu, 
  X, 
  FileText, 
  GraduationCap, 
  Bus, 
  Briefcase, 
  BookOpen, 
  Sun, 
  Moon,
  Shield,
  Lock,
  Key,
  IdCard,
  BellRing,
  Globe
} from 'lucide-react';
import { Student, StudentAcademicRecord, NationalExamPrep, StudentFeeLedger, FeeTransaction } from './types';
import { 
  INITIAL_STUDENTS, 
  INITIAL_ACADEMIC_RECORDS, 
  INITIAL_NATIONAL_EXAMS, 
  INITIAL_FEE_LEDGERS,
  DEMO_SAMPLE_STUDENTS,
  DEMO_SAMPLE_ACADEMIC_RECORDS,
  DEMO_SAMPLE_NATIONAL_EXAMS,
  DEMO_SAMPLE_FEE_LEDGERS,
  SCHOOL_INFO 
} from './initialData';
import { wipeAllSystemData, loadSampleDemoData } from './utils/dataStore';
import { recordDataEntry } from './utils/referenceLog';
import { 
  syncFirestoreCollection, 
  saveToFirestore, 
  deleteFromFirestore, 
  batchSaveToFirestore, 
  clearFirestoreCollection,
  clearAllFirestoreSchoolData 
} from './services/firestoreSync';

// Component Imports
import Dashboard from './components/Dashboard';
import StudentList from './components/StudentList';
import AcademicPortal from './components/AcademicPortal';
import ReportCardView from './components/ReportCardView';
import Financials from './components/Financials';
import DataBackup from './components/DataBackup';
import StudentPortal from './components/StudentPortal';
import BusManagement from './components/BusManagement';
import StaffManagement from './components/StaffManagement';
import Library from './components/Library';
import IdCardCenter from './components/IdCardCenter';
import NoticeManagement from './components/NoticeManagement';
import PublicWebsite from './components/PublicWebsite';
import GlobalHeader from './components/GlobalHeader';
import PrivilegesModal from './components/PrivilegesModal';
import AccessRestricted from './components/AccessRestricted';
import SessionLoginGate from './components/SessionLoginGate';
import { useAuth } from './context/AuthContext';
import { AnimatePresence } from 'motion/react';

import schoolLogo from './assets/logo.jpg';
import { getPendingFeeStudents, PendingFeeStudent } from './utils/feeUtils';
export { getPendingFeeStudents };
export type { PendingFeeStudent };

export default function App() {
  const { user, role, privileges, can, isFirebaseOnline, setPortalActive, unlockSession } = useAuth();
  const [isPrivilegesModalOpen, setIsPrivilegesModalOpen] = useState(false);

  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const cached = localStorage.getItem('sma_theme');
    if (cached === 'dark' || cached === 'light') return cached;
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('sma_theme', theme);
  }, [theme]);

  // Navigation State - Always defaults to open public website (no login/pin required)
  const [viewMode, setViewMode] = useState<'website' | 'portal'>('website');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [navigationArgs, setNavigationArgs] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Keep portal active status in sync with viewMode
  useEffect(() => {
    if (viewMode === 'website') {
      setPortalActive(false);
    } else {
      setPortalActive(true);
    }
  }, [viewMode, setPortalActive]);

  // Core Database States
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<StudentAcademicRecord[]>([]);
  const [examPreps, setExamPreps] = useState<NationalExamPrep[]>([]);
  const [fees, setFees] = useState<StudentFeeLedger[]>([]);

  // Navigation Links definition with RBAC permissions
  const NAV_LINKS = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'canViewDashboard' as const, moduleName: 'Executive Dashboard', requiredDesc: 'Dashboard & KPI viewing permission' },
    { id: 'notices', label: 'Noticeboard & SMS', icon: BellRing, permission: 'canViewStudents' as const, moduleName: 'Noticeboard & SMS Dispatch Center', requiredDesc: 'Publish notices and audit class SMS broadcasts' },
    { id: 'students', label: 'Student Files', icon: Users, permission: 'canViewStudents' as const, moduleName: 'Student Records', requiredDesc: 'Student registry access' },
    { id: 'id-cards', label: 'ID Cards & Badges', icon: IdCard, permission: 'canViewStudents' as const, moduleName: 'ID Card & Credential Center', requiredDesc: 'Student & Staff identification badge management' },
    { id: 'performance', label: 'Academic Portal', icon: Award, permission: 'canViewAcademics' as const, moduleName: 'Academic Portal', requiredDesc: 'Academic grading & terminal performance access' },
    { id: 'fees', label: 'Tuition Accounts', icon: CreditCard, permission: 'canViewFinances' as const, moduleName: 'Tuition & Financial Accounts', requiredDesc: 'School Bursary and financial ledgers access' },
    { id: 'staff-management', label: 'Staff Management', icon: Briefcase, permission: 'canManageStaff' as const, moduleName: 'Staff & Personnel Management', requiredDesc: 'Staff administration and payroll authority' },
    { id: 'library', label: 'School Library', icon: BookOpen, permission: 'canManageLibrary' as const, moduleName: 'School Library Catalog', requiredDesc: 'Library resources and lending privileges' },
    { id: 'student-portal', label: 'Student Portal', icon: GraduationCap, permission: 'canViewStudentPortal' as const, moduleName: 'Student & Guardian Portal', requiredDesc: 'Student / Guardian personal viewer privilege' },
    { id: 'bus-service', label: 'School Bus', icon: Bus, permission: 'canManageBus' as const, moduleName: 'School Bus Fleet & Logistics', requiredDesc: 'Transportation logistics management' },
    { id: 'backup', label: 'Data Center', icon: Database, permission: 'canBackupData' as const, moduleName: 'System Administration & Backup', requiredDesc: 'Super Administrator system data privileges' }
  ];

  // Auto redirect if current tab is forbidden when switching role
  useEffect(() => {
    const currentLink = NAV_LINKS.find(n => n.id === activeTab);
    if (currentLink && !can(currentLink.permission)) {
      if (can('canViewDashboard')) setActiveTab('dashboard');
      else if (can('canViewStudentPortal')) setActiveTab('student-portal');
      else if (can('canViewAcademics')) setActiveTab('performance');
      else if (can('canViewFinances')) setActiveTab('fees');
      else if (can('canManageBus')) setActiveTab('bus-service');
    }
  }, [role]);

  // 1. Real-time Cloud Firestore & LocalStorage Synchronization
  useEffect(() => {
    // Realtime Sync for Students
    const unsubStudents = syncFirestoreCollection<Student>(
      'students',
      'sma_students',
      (items) => setStudents(items),
      INITIAL_STUDENTS
    );

    // Realtime Sync for Academic Records
    const unsubRecords = syncFirestoreCollection<StudentAcademicRecord>(
      'academic_records',
      'sma_academic_records',
      (items) => setRecords(items),
      INITIAL_ACADEMIC_RECORDS
    );

    // Realtime Sync for National Exam Preps
    const unsubPreps = syncFirestoreCollection<NationalExamPrep>(
      'exam_preps',
      'sma_exam_preps',
      (items) => setExamPreps(items),
      INITIAL_NATIONAL_EXAMS
    );

    // Realtime Sync for Fee Ledgers
    const unsubFees = syncFirestoreCollection<StudentFeeLedger>(
      'fee_ledgers',
      'sma_fee_ledgers',
      (items) => setFees(items),
      INITIAL_FEE_LEDGERS
    );

    const handleLocalWipe = () => {
      setStudents([]);
      setRecords([]);
      setExamPreps([]);
      setFees([]);
    };

    window.addEventListener('sma_database_wiped', handleLocalWipe);

    // Initial clean-slate enforcement for user request: "Delete all records"
    const purgeFlag = 'sma_user_clean_slate_executed_v1';
    if (typeof window !== 'undefined' && !localStorage.getItem(purgeFlag)) {
      localStorage.setItem(purgeFlag, 'true');
      wipeAllSystemData();
      clearAllFirestoreSchoolData().catch(e => console.warn('Clean slate sync notice:', e));
      recordDataEntry({
        type: 'Database System Wipe',
        category: 'System',
        title: 'Initial Live System Clean Slate Activated',
        summary: 'All test and legacy records cleared for production. System is on a fresh, 100% clean slate ready for student registrations and all data entries are permanently referenced.',
        status: 'Historical Reference'
      });
    }

    return () => {
      unsubStudents();
      unsubRecords();
      unsubPreps();
      unsubFees();
      window.removeEventListener('sma_database_wiped', handleLocalWipe);
    };
  }, []);

  // Helpers to persist state modifications to local cache
  const saveStateToStorage = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('Local storage write error:', e);
    }
  };

  // 2. Student CRUD Triggers & Referential Consistency with Cloud Firestore
  const handleAddStudent = (newStudent: Student) => {
    const updatedStuds = [newStudent, ...students];
    setStudents(updatedStuds);
    saveStateToStorage('sma_students', updatedStuds);
    // Persist to Cloud Firestore immediately
    saveToFirestore('students', newStudent.id, newStudent);

    // Permanent Data Entry Reference Tracking
    recordDataEntry({
      type: 'Student Registration',
      category: 'Registry',
      title: `Student Enrolled: ${newStudent.name}`,
      summary: `Enrolled into ${newStudent.currentClass} (ID: ${newStudent.id}, Admission: ${newStudent.admissionNumber}, Parent: ${newStudent.parentName}, Phone: ${newStudent.parentPhone})`,
      targetId: newStudent.id,
      details: newStudent,
      status: 'Saved & Active'
    });

    // Initialize blank terminal grades record
    const newRecord: StudentAcademicRecord = {
      studentId: newStudent.id,
      academicYear: '2025/2026',
      terms: {
        1: { grades: [], teacherRemarks: '', principalRemarks: '', conduct: 'Excellent', attendance: { totalDays: 70, presentDays: 70 } },
        2: { grades: [], teacherRemarks: '', principalRemarks: '', conduct: 'Excellent', attendance: { totalDays: 70, presentDays: 70 } },
        3: { grades: [], teacherRemarks: '', principalRemarks: '', conduct: 'Excellent', attendance: { totalDays: 70, presentDays: 70 } }
      }
    };
    const updatedRecs = [newRecord, ...records];
    setRecords(updatedRecs);
    saveStateToStorage('sma_academic_records', updatedRecs);
    saveToFirestore('academic_records', newStudent.id, newRecord);

    // Initialize tuition fee ledger depending on class levels
    let termFee = 2500;
    const newClass = newStudent.currentClass || '';
    if (newClass.startsWith('JSS')) termFee = 3500;
    if (newClass.startsWith('SSS')) termFee = 4500;

    const newLedger: StudentFeeLedger = {
      studentId: newStudent.id,
      academicYear: '2025/2026',
      terms: {
        1: { totalDue: termFee, paidAmount: 0, balance: termFee, status: 'Unpaid', transactions: [] },
        2: { totalDue: termFee, paidAmount: 0, balance: termFee, status: 'Unpaid', transactions: [] },
        3: { totalDue: termFee, paidAmount: 0, balance: termFee, status: 'Unpaid', transactions: [] }
      }
    };
    const updatedFees = [newLedger, ...fees];
    setFees(updatedFees);
    saveStateToStorage('sma_fee_ledgers', updatedFees);
    saveToFirestore('fee_ledgers', newStudent.id, newLedger);
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    const updatedStuds = students.map(s => s.id === updatedStudent.id ? updatedStudent : s);
    setStudents(updatedStuds);
    saveStateToStorage('sma_students', updatedStuds);
    saveToFirestore('students', updatedStudent.id, updatedStudent);

    // Permanent Data Entry Reference Tracking
    recordDataEntry({
      type: 'Student Profile Update',
      category: 'Registry',
      title: `Student Profile Updated: ${updatedStudent.name}`,
      summary: `Updated profile for ${updatedStudent.name} (${updatedStudent.currentClass}). Status: ${updatedStudent.status}, Verified: ${updatedStudent.verified ? 'Yes' : 'No'}`,
      targetId: updatedStudent.id,
      details: updatedStudent,
      status: 'Saved & Active'
    });

    // Adjust fee ledgers if class tier changed (Prep/Primary to JSS or SSS)
    const original = students.find(s => s.id === updatedStudent.id);
    if (original && original.currentClass !== updatedStudent.currentClass) {
      let termFee = 2500;
      const updatedClass = updatedStudent.currentClass || '';
      if (updatedClass.startsWith('JSS')) termFee = 3500;
      if (updatedClass.startsWith('SSS')) termFee = 4500;

      let changedLedger: StudentFeeLedger | null = null;
      const updatedFees = fees.map(f => {
        if (f.studentId === updatedStudent.id) {
          const updatedTerms = { ...f.terms };
          [1, 2, 3].forEach(t => {
            updatedTerms[t].totalDue = termFee;
            updatedTerms[t].balance = Math.max(0, termFee - updatedTerms[t].paidAmount);
            updatedTerms[t].status = updatedTerms[t].balance <= 0 
              ? 'Paid' 
              : (updatedTerms[t].paidAmount > 0 ? 'Partial' : 'Unpaid');
          });
          changedLedger = { ...f, terms: updatedTerms };
          return changedLedger;
        }
        return f;
      });
      setFees(updatedFees);
      saveStateToStorage('sma_fee_ledgers', updatedFees);
      if (changedLedger) {
        saveToFirestore('fee_ledgers', updatedStudent.id, changedLedger);
      }
    }
  };

  const handleDeleteStudent = (id: string) => {
    const target = students.find(s => s.id === id);
    const targetName = target ? target.name : `Student ID ${id}`;
    const targetClass = target ? target.currentClass : 'Unspecified';

    const updatedStuds = students.filter(s => s.id !== id);
    setStudents(updatedStuds);
    saveStateToStorage('sma_students', updatedStuds);
    deleteFromFirestore('students', id);

    // Cascade deletion of secondary records
    const updatedRecs = records.filter(r => r.studentId !== id);
    setRecords(updatedRecs);
    saveStateToStorage('sma_academic_records', updatedRecs);
    deleteFromFirestore('academic_records', id);

    const updatedPreps = examPreps.filter(ep => ep.studentId !== id);
    setExamPreps(updatedPreps);
    saveStateToStorage('sma_exam_preps', updatedPreps);
    deleteFromFirestore('exam_preps', id);

    const updatedFees = fees.filter(f => f.studentId !== id);
    setFees(updatedFees);
    saveStateToStorage('sma_fee_ledgers', updatedFees);
    deleteFromFirestore('fee_ledgers', id);

    // Permanent Data Entry Reference Tracking (Safely archives deleted record)
    recordDataEntry({
      type: 'Student Record Deletion',
      category: 'Registry',
      title: `Student Record Deleted: ${targetName}`,
      summary: `Deleted student ${targetName} (${targetClass}, ID: ${id}) from active registry. Academic grades and fee accounts cascaded. Record safely preserved in Reference Archive.`,
      targetId: id,
      details: target || { id },
      status: 'Deleted From Registry'
    });
  };

  // 3. Academic & Exams Updators
  const handleUpdateRecord = (updatedRecord: StudentAcademicRecord) => {
    const updated = records.map(r => r.studentId === updatedRecord.studentId ? updatedRecord : r);
    setRecords(updated);
    saveStateToStorage('sma_academic_records', updated);
    saveToFirestore('academic_records', updatedRecord.studentId, updatedRecord);

    const target = students.find(s => s.id === updatedRecord.studentId);
    recordDataEntry({
      type: 'Continuous Assessment Grade',
      category: 'Academics',
      title: `Academic Marks Updated: ${target?.name || updatedRecord.studentId}`,
      summary: `Recorded terminal continuous assessments and examination remarks for Academic Year ${updatedRecord.academicYear}.`,
      targetId: updatedRecord.studentId,
      details: updatedRecord,
      status: 'Saved & Active'
    });
  };

  const handleUpdateExamPrep = (updatedExamPrep: NationalExamPrep) => {
    const exists = examPreps.some(ep => ep.studentId === updatedExamPrep.studentId);
    let updated;
    if (exists) {
      updated = examPreps.map(ep => ep.studentId === updatedExamPrep.studentId ? updatedExamPrep : ep);
    } else {
      updated = [updatedExamPrep, ...examPreps];
    }
    setExamPreps(updated);
    saveStateToStorage('sma_exam_preps', updated);
    saveToFirestore('exam_preps', updatedExamPrep.studentId, updatedExamPrep);

    const target = students.find(s => s.id === updatedExamPrep.studentId);
    recordDataEntry({
      type: 'National Exam Prep',
      category: 'Academics',
      title: `National Exam Milestone: ${target?.name || updatedExamPrep.studentId}`,
      summary: `WAEC / NPSE / BECE exam trial readiness prep recorded (${updatedExamPrep.examType || 'WAEC'}).`,
      targetId: updatedExamPrep.studentId,
      details: updatedExamPrep,
      status: 'Saved & Active'
    });
  };

  // 4. Financial Updators (Adding transaction receipts)
  const handleAddTransaction = (studentId: string, term: number, tx: Omit<FeeTransaction, 'id'>) => {
    const newTx: FeeTransaction = {
      ...tx,
      id: `tx-${Date.now()}`
    };

    let updatedLedgerToSave: StudentFeeLedger | null = null;
    const updatedFees = fees.map(ledger => {
      if (ledger.studentId === studentId) {
        const termData = ledger.terms[term];
        const newPaid = termData.paidAmount + tx.amount;
        const newBalance = Math.max(0, termData.totalDue - newPaid);
        const newStatus = newBalance <= 0 ? 'Paid' : (newPaid > 0 ? 'Partial' : 'Unpaid');

        const updatedLedger: StudentFeeLedger = {
          ...ledger,
          terms: {
            ...ledger.terms,
            [term]: {
              ...termData,
              paidAmount: newPaid,
              balance: newBalance,
              status: newStatus,
              transactions: [newTx, ...termData.transactions]
            }
          }
        };
        updatedLedgerToSave = updatedLedger;
        return updatedLedger;
      }
      return ledger;
    });

    setFees(updatedFees);
    saveStateToStorage('sma_fee_ledgers', updatedFees);
    if (updatedLedgerToSave) {
      saveToFirestore('fee_ledgers', studentId, updatedLedgerToSave);
    }

    // Permanent Data Entry Reference Tracking
    const targetStudent = students.find(s => s.id === studentId);
    recordDataEntry({
      type: 'Tuition Payment Receipt',
      category: 'Finance',
      title: `Tuition Receipt ${newTx.receiptNumber}: ${targetStudent ? targetStudent.name : studentId}`,
      summary: `Payment of SLE ${newTx.amount.toLocaleString()} received for Term ${term} via ${newTx.paymentMethod}. Receipt: ${newTx.receiptNumber}.`,
      targetId: studentId,
      details: newTx,
      status: 'Saved & Active'
    });
  };

  // 5. Restore Database from custom center
  const handleRestoreData = (data: {
    students: Student[];
    records: StudentAcademicRecord[];
    examPreps: NationalExamPrep[];
    fees: StudentFeeLedger[];
  }) => {
    setStudents(data.students);
    setRecords(data.records);
    setExamPreps(data.examPreps);
    setFees(data.fees);

    saveStateToStorage('sma_students', data.students);
    saveStateToStorage('sma_academic_records', data.records);
    saveStateToStorage('sma_exam_preps', data.examPreps);
    saveStateToStorage('sma_fee_ledgers', data.fees);

    batchSaveToFirestore('students', data.students);
    batchSaveToFirestore('academic_records', data.records, 'studentId');
    batchSaveToFirestore('exam_preps', data.examPreps, 'studentId');
    batchSaveToFirestore('fee_ledgers', data.fees, 'studentId');
  };

  const handleResetData = async () => {
    recordDataEntry({
      type: 'Database System Wipe',
      category: 'System',
      title: 'Complete Database Clean Slate Executed',
      summary: 'All students, grades, fee transactions, faculty, library items, bus routes, and attendance records purged from active operational storage. Data archived in Reference Ledger.',
      status: 'Historical Reference'
    });
    wipeAllSystemData();
    setStudents([]);
    setRecords([]);
    setExamPreps([]);
    setFees([]);

    await clearAllFirestoreSchoolData();
  };

  const handleLoadDemoData = () => {
    loadSampleDemoData();
    setStudents(DEMO_SAMPLE_STUDENTS);
    setRecords(DEMO_SAMPLE_ACADEMIC_RECORDS);
    setExamPreps(DEMO_SAMPLE_NATIONAL_EXAMS);
    setFees(DEMO_SAMPLE_FEE_LEDGERS);

    batchSaveToFirestore('students', DEMO_SAMPLE_STUDENTS);
    batchSaveToFirestore('academic_records', DEMO_SAMPLE_ACADEMIC_RECORDS, 'studentId');
    batchSaveToFirestore('exam_preps', DEMO_SAMPLE_NATIONAL_EXAMS, 'studentId');
    batchSaveToFirestore('fee_ledgers', DEMO_SAMPLE_FEE_LEDGERS, 'studentId');
  };

  // Helper to deep route tabs and clear/set navigation params
  const handleNavigate = (tab: string, arg?: any) => {
    setNavigationArgs(arg || null);
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  // Find active tab metadata for RBAC checks
  const activeLinkMeta = NAV_LINKS.find(link => link.id === activeTab);
  const isReportCardRestricted = activeTab === 'report-card' && !can('canGenerateReportCards') && !can('canViewAcademics');
  const isCurrentTabRestricted = (activeLinkMeta && !can(activeLinkMeta.permission)) || isReportCardRestricted;

  const handleNavigateHome = () => {
    if (can('canViewDashboard')) setActiveTab('dashboard');
    else if (can('canViewStudentPortal')) setActiveTab('student-portal');
    else if (can('canViewAcademics')) setActiveTab('performance');
    else if (can('canViewFinances')) setActiveTab('fees');
    else if (can('canManageBus')) setActiveTab('bus-service');
    else setActiveTab('dashboard');
  };

  // Render Public Website Mode - Open access with no password or PIN
  if (viewMode === 'website') {
    return (
      <div className="min-h-screen bg-slate-50 font-sans" id="main-public-website-view">
        <PublicWebsite 
          onEnterPortal={(targetTab) => {
            if (targetTab) setActiveTab(targetTab);
            setPortalActive(true);
            setViewMode('portal');
          }}
          students={students}
        />

        {/* Privileges & Authentication Modal */}
        <PrivilegesModal 
          isOpen={isPrivilegesModalOpen}
          onClose={() => setIsPrivilegesModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row font-sans text-slate-800 dark:text-slate-100 transition-colors duration-200" id="main-app-container">
      
      {/* 1. Sidebar Navigation (Desktop) - Hidden when printing report cards */}
      <aside className="w-68 bg-slate-900 text-white flex flex-col shrink-0 border-r border-slate-800 hidden md:flex print:hidden" id="desktop-sidebar">
        {/* Sidebar Header with SL Flag */}
        <div className="p-5 border-b border-slate-800 relative">
          <div className="flex h-1 w-full overflow-hidden rounded-full absolute top-0 left-0">
            <div className="bg-emerald-500 w-1/3"></div>
            <div className="bg-white w-1/3"></div>
            <div className="bg-blue-500 w-1/3"></div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2.5">
              <img 
                src={schoolLogo} 
                alt={`${SCHOOL_INFO.name} Logo`} 
                className="w-9 h-9 rounded-xl object-contain bg-white p-0.5 shadow-xs border border-slate-700"
                referrerPolicy="no-referrer"
              />
              <div>
                <h2 className="font-extrabold text-xs tracking-tight leading-tight uppercase">{SCHOOL_INFO.name}</h2>
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Management System</span>
              </div>
            </div>
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-700 shadow-xs flex items-center justify-center"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>
          </div>

          {/* Return to Public Website Button */}
          <button
            type="button"
            onClick={() => setViewMode('website')}
            className="w-full mt-3 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-xs transition-all cursor-pointer"
            id="sidebar-back-to-website-btn"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Public School Website</span>
          </button>
        </div>

        {/* Sidebar Navigation Links */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto" id="desktop-nav-panel">
          {NAV_LINKS.map(link => {
            const Icon = link.icon;
            const isTabActive = activeTab === link.id || (link.id === 'performance' && activeTab === 'report-card');
            const hasAccess = can(link.permission);

            return (
              <button
                key={link.id}
                onClick={() => handleNavigate(link.id)}
                className={`w-full flex items-center justify-between py-2.5 px-3.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  isTabActive 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40' 
                    : hasAccess
                      ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      : 'text-slate-500 hover:bg-slate-800/60 hover:text-slate-300 opacity-75'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{link.label}</span>
                </div>
                {!hasAccess && (
                  <span title="Restricted by role privilege">
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer: Authenticated User & Role Profile Card */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/50">
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/70 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-extrabold flex items-center justify-center text-xs overflow-hidden shrink-0 shadow-xs">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.displayName?.charAt(0).toUpperCase() || 'A'}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white truncate block">
                    {user?.displayName || 'Administrator'}
                  </span>
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded leading-none ${
                    role === 'admin' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                    role === 'teacher' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    role === 'bursar' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    role === 'transport' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                    'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  }`}>
                    {role.toUpperCase()}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 truncate block mt-0.5">
                  {user?.email || 'Authenticated User'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsPrivilegesModalOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Privileges & Role Switcher</span>
            </button>
          </div>

          <div className="flex items-center justify-between mt-2.5 px-1 text-[10px] text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isFirebaseOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span>{isFirebaseOnline ? 'Cloud Rules Active' : 'Local RBAC Mode'}</span>
            </span>
            <span>v2.4 Pro</span>
          </div>
        </div>
      </aside>

      {/* 2. Top Header Navigation (Mobile) - Hidden when printing */}
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center md:hidden print:hidden" id="mobile-header">
        <div className="flex items-center gap-2">
          <img 
            src={schoolLogo} 
            alt={`${SCHOOL_INFO.name} Logo`} 
            className="w-7 h-7 rounded-lg object-contain bg-white p-0.5 border border-slate-700"
            referrerPolicy="no-referrer"
          />
          <h2 className="font-bold text-xs uppercase">{SCHOOL_INFO.systemName}</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPrivilegesModalOpen(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-white transition-all cursor-pointer border border-slate-700 flex items-center justify-center"
            title="Open Privileges"
          >
            <Shield className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-700 flex items-center justify-center"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-40 md:hidden flex justify-end" id="mobile-drawer">
            <div className="w-72 bg-slate-900 text-white h-full p-5 flex flex-col space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div>
                  <span className="font-bold text-xs tracking-wider text-indigo-400 block">SECURITY CONSOLE</span>
                  <span className="text-[10px] text-slate-400">Role: <strong className="text-white uppercase">{role}</strong></span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 space-y-1.5 overflow-y-auto">
                {NAV_LINKS.map(link => {
                  const Icon = link.icon;
                  const isTabActive = activeTab === link.id;
                  const hasAccess = can(link.permission);
                  return (
                    <button
                      key={link.id}
                      onClick={() => handleNavigate(link.id)}
                      className={`w-full flex items-center justify-between py-2.5 px-3.5 rounded-xl text-xs font-semibold tracking-wider transition-all cursor-pointer ${
                        isTabActive 
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/20' 
                          : hasAccess
                            ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            : 'text-slate-500 opacity-75'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{link.label}</span>
                      </div>
                      {!hasAccess && <Lock className="w-3.5 h-3.5 text-slate-500" />}
                    </button>
                  );
                })}
              </nav>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setViewMode('website');
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Globe className="w-4 h-4" />
                <span>Return to Public Website</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsPrivilegesModalOpen(true);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Shield className="w-4 h-4" />
                <span>Privileges & Switcher</span>
              </button>

              <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-3">
                <p>{SCHOOL_INFO.name}</p>
                <p className="text-indigo-500 font-bold mt-0.5">Role-Based Access Control</p>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Global Layout Header with Search Bar */}
        <GlobalHeader 
          students={students}
          fees={fees}
          activeTab={activeTab}
          onNavigate={handleNavigate}
          onOpenPrivileges={() => setIsPrivilegesModalOpen(true)}
          onNavigateToWebsite={() => setViewMode('website')}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-8" id="workspace-viewport">
          {/* RBAC Access Guard Check */}
          {isCurrentTabRestricted ? (
            <AccessRestricted 
              moduleName={activeLinkMeta?.moduleName || 'Restricted Area'}
              requiredPrivilege={activeLinkMeta?.requiredDesc || 'Role-specific privilege required'}
              onNavigateHome={handleNavigateHome}
              onOpenPrivileges={() => setIsPrivilegesModalOpen(true)}
            />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <Dashboard 
                  students={students} 
                  records={records} 
                  examPreps={examPreps} 
                  fees={fees} 
                  onNavigate={handleNavigate}
                  onUpdateStudent={handleUpdateStudent}
                />
              )}

              {activeTab === 'notices' && (
                <NoticeManagement 
                  students={students}
                />
              )}

              {activeTab === 'students' && (
                <StudentList 
                  students={students} 
                  onAddStudent={handleAddStudent}
                  onUpdateStudent={handleUpdateStudent}
                  onDeleteStudent={handleDeleteStudent}
                  onNavigate={handleNavigate}
                  initialSearch={navigationArgs?.search}
                  initialSelectedStudentId={navigationArgs?.studentId}
                />
              )}

              {activeTab === 'id-cards' && (
                <IdCardCenter 
                  students={students} 
                  onNavigate={handleNavigate}
                  initialSelection={navigationArgs}
                />
              )}

              {activeTab === 'performance' && (
                <AcademicPortal 
                  students={students} 
                  records={records} 
                  examPreps={examPreps} 
                  onUpdateRecord={handleUpdateRecord}
                  onUpdateExamPrep={handleUpdateExamPrep}
                  initialSelectedStudentId={navigationArgs?.studentId}
                  initialTab={navigationArgs?.tab}
                />
              )}

              {activeTab === 'report-card' && (
                <ReportCardView 
                  students={students} 
                  records={records} 
                  onNavigateBack={() => handleNavigate('students')}
                  initialStudentId={navigationArgs?.studentId}
                />
              )}

              {activeTab === 'fees' && (
                <Financials 
                  students={students} 
                  fees={fees} 
                  onAddTransaction={handleAddTransaction}
                  initialStudentId={navigationArgs?.studentId}
                  initialTerm={navigationArgs?.term || navigationArgs?.initialTerm}
                  openSmsModal={navigationArgs?.openSmsModal}
                />
              )}

              {activeTab === 'staff-management' && (
                <StaffManagement 
                  students={students} 
                  onNavigate={handleNavigate}
                />
              )}

              {activeTab === 'library' && (
                <Library 
                  students={students} 
                />
              )}

              {activeTab === 'student-portal' && (
                <StudentPortal 
                  students={students} 
                  records={records} 
                  fees={fees} 
                />
              )}

              {activeTab === 'bus-service' && (
                <BusManagement 
                  students={students} 
                />
              )}

              {activeTab === 'backup' && (
                <DataBackup 
                  students={students} 
                  records={records} 
                  examPreps={examPreps} 
                  fees={fees} 
                  onRestoreData={handleRestoreData}
                  onResetData={handleResetData}
                  onLoadDemoData={handleLoadDemoData}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Privileges & Authentication Modal */}
      <PrivilegesModal 
        isOpen={isPrivilegesModalOpen}
        onClose={() => setIsPrivilegesModalOpen(false)}
      />

      {/* Inactivity Session Lock & Login Gate (Portal Only - user can always exit to public website) */}
      <SessionLoginGate 
        onReturnToWebsite={() => {
          setPortalActive(false);
          setViewMode('website');
        }}
      />

    </div>
  );
}
