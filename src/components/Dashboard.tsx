/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { 
  Users, 
  GraduationCap, 
  Wallet, 
  AlertCircle, 
  TrendingUp, 
  BookOpen, 
  Award,
  CheckCircle,
  FileSpreadsheet,
  TrendingDown,
  Info,
  Search,
  CreditCard,
  ChevronRight,
  User,
  ArrowRight,
  Send,
  Mail,
  MessageSquare,
  Bell,
  Phone,
  Copy,
  X,
  Clock,
  Sparkles,
  ShieldAlert,
  Building2,
  ShieldCheck,
  PhoneCall,
  RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Student, StudentAcademicRecord, NationalExamPrep, StudentFeeLedger } from '../types';
import { SCHOOL_INFO } from '../initialData';
import { useAuth } from '../context/AuthContext';
import PrincipalsNoticeBanner from './PrincipalsNoticeBanner';
import VerificationQueue from './VerificationQueue';
import FinancialHealthCard from './FinancialHealthCard';
import StudentAttendanceTrendsChart from './StudentAttendanceTrendsChart';
import PerformanceTrendsCard from './PerformanceTrendsCard';
import PendingFeeAlertWidget from './PendingFeeAlertWidget';
import { getPendingFeeStudents } from '../utils/feeUtils';

interface DashboardProps {
  students: Student[];
  records: StudentAcademicRecord[];
  examPreps: NationalExamPrep[];
  fees: StudentFeeLedger[];
  onNavigate: (tab: string, arg?: any) => void;
  onUpdateStudent?: (student: Student) => void;
}

export default function Dashboard({ students, records, examPreps, fees, onNavigate, onUpdateStudent }: DashboardProps) {
  const { role, can } = useAuth();
  const isAdmin = role === 'admin' || can('canVerifyStaffAndStudents');

  // Subtle Loading & Sync Animation State during data operations
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Live');

  React.useEffect(() => {
    setIsSyncing(true);
    const timer = setTimeout(() => {
      setIsSyncing(false);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 650);
    return () => clearTimeout(timer);
  }, [students.length, records.length, examPreps.length, fees.length]);

  const handleManualRefresh = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 650);
  };

  // 1. Calculations
  const activeStudents = students.filter(s => s.status === 'Active');
  const totalStudentsCount = activeStudents.length;
  const maleCount = activeStudents.filter(s => s.gender === 'Male').length;
  const femaleCount = activeStudents.filter(s => s.gender === 'Female').length;
  const femalePercentage = totalStudentsCount > 0 ? Math.round((femaleCount / totalStudentsCount) * 100) : 0;

  // GPA Distribution Data mapping for recharts
  const gpaData = useMemo(() => {
    const tiers = [
      { name: 'Pre-School', filter: (c?: string) => (c || '').startsWith('Pre') || (c || '').startsWith('Prep') },
      { name: 'Nursery', filter: (c?: string) => (c || '').startsWith('Nursery') },
      { name: 'Primary', filter: (c?: string) => (c || '').startsWith('Class') },
      { name: 'JSS', filter: (c?: string) => (c || '').startsWith('JSS') },
      { name: 'SSS', filter: (c?: string) => (c || '').startsWith('SSS') },
      { name: 'University', filter: (c?: string) => (c || '').startsWith('University') },
    ];

    return tiers.map(tier => {
      const tierStudents = activeStudents.filter(s => tier.filter(s?.currentClass));
      let honorsHigh = 0; // 3.5 - 4.0
      let honors = 0;     // 3.0 - 3.49
      let passing = 0;    // 2.0 - 2.99
      let support = 0;    // < 2.0
      let sumGpa = 0;
      let countWithGpa = 0;

      tierStudents.forEach(student => {
        const record = records.find(r => r.studentId === student.id);
        if (record) {
          const grades = record.terms[3].grades.length > 0 ? record.terms[3].grades :
                         record.terms[2].grades.length > 0 ? record.terms[2].grades :
                         record.terms[1].grades.length > 0 ? record.terms[1].grades : [];
          if (grades.length > 0) {
            const totalGpa = grades.reduce((sum, g) => {
              const score = g.totalScore;
              let gpa = 0;
              if (score >= 80) gpa = 4.0;
              else if (score >= 75) gpa = 3.7;
              else if (score >= 70) gpa = 3.3;
              else if (score >= 65) gpa = 3.0;
              else if (score >= 60) gpa = 2.7;
              else if (score >= 55) gpa = 2.3;
              else if (score >= 50) gpa = 2.0;
              else if (score >= 45) gpa = 1.3;
              else if (score >= 40) gpa = 1.0;
              else gpa = 0.0;
              return sum + gpa;
            }, 0);
            const gpa = Number((totalGpa / grades.length).toFixed(2));
            sumGpa += gpa;
            countWithGpa++;

            if (gpa >= 3.5) honorsHigh++;
            else if (gpa >= 3.0) honors++;
            else if (gpa >= 2.0) passing++;
            else support++;
          } else {
            passing++; // default placeholder
          }
        } else {
          passing++; // default placeholder
        }
      });

      const averageGpa = countWithGpa > 0 ? Number((sumGpa / countWithGpa).toFixed(2)) : 2.5;

      return {
        gradeLevel: tier.name,
        'High Honors (3.5 - 4.0)': honorsHigh,
        'Honors (3.0 - 3.49)': honors,
        'Passing (2.0 - 2.99)': passing,
        'Needs Support (< 2.0)': support,
        averageGpa,
        totalStudents: tierStudents.length
      };
    });
  }, [activeStudents, records]);

  // Total Outstanding Tuition Fees (SLE - Sierra Leone New Leone)
  let totalOutstanding = 0;
  fees.forEach(ledger => {
    // Sum outstanding balances for active students
    const activeStud = activeStudents.find(s => s.id === ledger.studentId);
    if (activeStud) {
      Object.values(ledger.terms).forEach(term => {
        totalOutstanding += term.balance;
      });
    }
  });

  // Pending Fees State & Calculation (Term 3 default)
  const [pendingTermFilter, setPendingTermFilter] = useState<1 | 2 | 3>(3);
  const [pendingSearchQuery, setPendingSearchQuery] = useState('');
  const [pendingStatusFilter, setPendingStatusFilter] = useState<'All' | 'Unpaid' | 'Partial'>('All');

  // Automated Guardian Notification System State
  const [notifiedLog, setNotifiedLog] = useState<Record<string, { timestamp: string; channel: 'SMS' | 'Email' }>>({});
  const [noticeModal, setNoticeModal] = useState<{
    isOpen: boolean;
    student?: Student;
    balance?: number;
    totalDue?: number;
    term?: number;
    status?: 'Unpaid' | 'Partial';
    isBulk?: boolean;
  }>({ isOpen: false });
  const [noticeChannel, setNoticeChannel] = useState<'sms' | 'email'>('sms');
  const [noticeMessageText, setNoticeMessageText] = useState('');
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [copiedLeadershipPhone, setCopiedLeadershipPhone] = useState(false);
  const [noticeToast, setNoticeToast] = useState<string | null>(null);

  const handleCopyPhone = (phoneNum: string) => {
    navigator.clipboard.writeText(phoneNum);
    setCopiedLeadershipPhone(true);
    setTimeout(() => setCopiedLeadershipPhone(false), 2000);
  };

  // Helper to generate notification templates
  const generateNoticeContent = (
    channel: 'sms' | 'email', 
    student: Student, 
    balance: number, 
    totalDue: number, 
    term: number
  ) => {
    if (channel === 'sms') {
      return `GIVERS WORLD MISSION NOTICE: Dear ${student.parentName}, outstanding tuition fees of SLE ${balance.toLocaleString()} for ${student.name} (${student.currentClass}, Term ${term}) remain UNPAID. Kindly settle promptly via Orange Money (${SCHOOL_INFO.phone}) or at the school Bursary in Kambia. Thank you. Evangelist Saint Turay, CEO/Principal.`;
    } else {
      return `Subject: Urgent: Tuition Fee Overdue Notice - ${student.name} (Term ${term})

Dear ${student.parentName},

This is an official communication from the Bursary & Accounts Office of Givers World Mission (Kambia 2, Northern Province, Sierra Leone).

We wish to inform you that tuition fees for your child/ward remain unpaid for the current academic session:

• Student Name: ${student.name}
• Admission Number: ${student.admissionNumber}
• Class: ${student.currentClass}
• Academic Term: Term ${term} (2025/2026 Academic Year)
• Total Term Dues: SLE ${totalDue.toLocaleString()}
• Outstanding Overdue Balance: SLE ${balance.toLocaleString()}

PAYMENT OPTIONS:
1. Orange Money / Africell Money: ${SCHOOL_INFO.phone} (Reference: ${student.admissionNumber})
2. Zenith Bank SL / Rokel Commercial Bank (School Account)
3. School Bursary Office (Mon-Fri 8:00 AM - 4:00 PM)

Please disregard this notice if payment has been made in the last 24 hours. For verification, contact our administration office at ${SCHOOL_INFO.phone}.

Yours faithfully,
Evangelist Saint Turay
CEO/Principal, Givers World Mission`;
    }
  };

  // Open modal for single student
  const handleOpenNotice = (
    student: Student,
    balance: number,
    totalDue: number,
    term: number,
    status: 'Unpaid' | 'Partial',
    e?: React.MouseEvent
  ) => {
    if (e) e.stopPropagation();
    const defaultText = generateNoticeContent(noticeChannel, student, balance, totalDue, term);
    setNoticeMessageText(defaultText);
    setNoticeModal({
      isOpen: true,
      student,
      balance,
      totalDue,
      term,
      status,
      isBulk: false
    });
  };

  // Open modal for bulk notification
  const handleOpenBulkNotice = () => {
    const unpaidOnly = pendingFeeStudents.filter(s => s.status === 'Unpaid');
    setNoticeModal({
      isOpen: true,
      term: pendingTermFilter,
      isBulk: true
    });
    setNoticeMessageText(
      `GIVERS WORLD MISSION BATCH NOTICE: Dear Guardian, tuition fees for Term ${pendingTermFilter} are overdue. Kindly settle outstanding balance via Orange Money (${SCHOOL_INFO.phone}) or at the school Bursary before examinations commence. Thank you. Evangelist Saint Turay, CEO/Principal.`
    );
  };

  // Switch channel in modal
  const handleChannelSwitch = (channel: 'sms' | 'email') => {
    setNoticeChannel(channel);
    if (noticeModal.student && noticeModal.balance !== undefined && noticeModal.totalDue !== undefined && noticeModal.term !== undefined) {
      setNoticeMessageText(generateNoticeContent(channel, noticeModal.student, noticeModal.balance, noticeModal.totalDue, noticeModal.term));
    }
  };

  // Dispatch notice
  const handleDispatchNotice = () => {
    if (noticeModal.isBulk) {
      const unpaidOnly = pendingFeeStudents.filter(s => s.status === 'Unpaid');
      const newLogs = { ...notifiedLog };
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      unpaidOnly.forEach(item => {
        newLogs[item.student.id] = { timestamp: now, channel: noticeChannel === 'sms' ? 'SMS' : 'Email' };
      });
      setNotifiedLog(newLogs);
      setNoticeToast(`Dispatched automated ${noticeChannel.toUpperCase()} reminders to ${unpaidOnly.length} guardians.`);
      setTimeout(() => setNoticeToast(null), 4500);
      setNoticeModal({ isOpen: false });
    } else if (noticeModal.student) {
      const studentId = noticeModal.student.id;
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setNotifiedLog(prev => ({
        ...prev,
        [studentId]: { timestamp: now, channel: noticeChannel === 'sms' ? 'SMS' : 'Email' }
      }));
      setNoticeToast(`Overdue fee ${noticeChannel.toUpperCase()} notification delivered to ${noticeModal.student.parentName} (${noticeModal.student.parentPhone}).`);
      setTimeout(() => setNoticeToast(null), 4500);
      setNoticeModal({ isOpen: false });
    }
  };

  // Copy notice text
  const handleCopyNotice = () => {
    navigator.clipboard.writeText(noticeMessageText);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2000);
  };

  // Identifies active students with 'Unpaid' or 'Partial' fee status for the selected term using getPendingFeeStudents
  const pendingFeeStudents = useMemo(() => {
    return getPendingFeeStudents(students, fees, pendingTermFilter);
  }, [students, fees, pendingTermFilter]);

  // Filter pending list by search query and status filter
  const filteredPendingList = useMemo(() => {
    return pendingFeeStudents.filter(item => {
      const matchesStatus = pendingStatusFilter === 'All' || item.status === pendingStatusFilter;
      const query = pendingSearchQuery.trim().toLowerCase();
      const matchesQuery = !query || 
        (item.student.name || '').toLowerCase().includes(query) ||
        (item.student.admissionNumber || '').toLowerCase().includes(query) ||
        (item.student.currentClass || '').toLowerCase().includes(query);

      return matchesStatus && matchesQuery;
    });
  }, [pendingFeeStudents, pendingSearchQuery, pendingStatusFilter]);

  const totalPendingBalanceForTerm = useMemo(() => {
    return pendingFeeStudents.reduce((sum, item) => sum + item.balance, 0);
  }, [pendingFeeStudents]);

  // National Exam Candidates
  const examCandidateCount = examPreps.filter(ep => ep.registered).length;

  // Average Score across school (Term 3 averages)
  let sumAverage = 0;
  let recordCount = 0;
  records.forEach(r => {
    const isTerm3Active = r.terms[3].grades.length > 0;
    const grades = isTerm3Active ? r.terms[3].grades : r.terms[2].grades;
    if (grades.length > 0) {
      const avg = grades.reduce((sum, g) => sum + g.totalScore, 0) / grades.length;
      sumAverage += avg;
      recordCount++;
    }
  });
  const schoolAverageScore = recordCount > 0 ? Math.round(sumAverage / recordCount) : 0;

  // Class distribution calculation
  const levelCounts = {
    'Pre-School': activeStudents.filter(s => (s.currentClass || '').startsWith('Pre') || (s.currentClass || '').startsWith('Prep')).length,
    Nursery: activeStudents.filter(s => (s.currentClass || '').startsWith('Nursery')).length,
    Primary: activeStudents.filter(s => (s.currentClass || '').startsWith('Class')).length,
    JSS: activeStudents.filter(s => (s.currentClass || '').startsWith('JSS')).length,
    SSS: activeStudents.filter(s => (s.currentClass || '').startsWith('SSS')).length,
    University: activeStudents.filter(s => (s.currentClass || '').startsWith('University')).length,
  };

  const levelColors = {
    'Pre-School': 'bg-rose-500',
    Nursery: 'bg-amber-500',
    Primary: 'bg-indigo-500',
    JSS: 'bg-blue-500',
    SSS: 'bg-purple-500',
    University: 'bg-emerald-500',
  };

  // Recent high achievers (Average grade > 75 in latest term)
  const highPerformers = records
    .map(r => {
      const student = students.find(s => s.id === r.studentId);
      if (!student || student.status !== 'Active') return null;
      const grades = r.terms[3].grades.length > 0 ? r.terms[3].grades : r.terms[2].grades;
      if (grades.length === 0) return null;
      const average = Math.round(grades.reduce((sum, g) => sum + g.totalScore, 0) / grades.length);
      return { student, average };
    })
    .filter((p): p is { student: Student; average: number } => p !== null && p.average >= 75)
    .slice(0, 4);

  // Critical items (Unpaid Term 3 fees or low exam prep score)
  const lowPreps = examPreps
    .filter(ep => {
      const student = students.find(s => s.id === ep.studentId);
      if (!student || student.status !== 'Active') return false;
      const scores = ep.subjectsScores;
      const avgMock = scores.reduce((sum, s) => sum + s.mockScore, 0) / scores.length;
      return avgMock < 55;
    })
    .map(ep => {
      const student = students.find(s => s.id === ep.studentId)!;
      const scores = ep.subjectsScores;
      const avgMock = Math.round(scores.reduce((sum, s) => sum + s.mockScore, 0) / scores.length);
      return { student, type: ep.examType, average: avgMock };
    });

  // Attendance rate calculation across school levels for current term (Term 3)
  const attendanceData = useMemo(() => {
    const levels: Record<string, { level: string; present: number; total: number }> = {
      PreSchool: { level: 'Pre (1-3)', present: 0, total: 0 },
      Nursery: { level: 'Nursery (1-3)', present: 0, total: 0 },
      Primary: { level: 'Primary (1-6)', present: 0, total: 0 },
      JSS: { level: 'JSS (1-3)', present: 0, total: 0 },
      SSS: { level: 'SSS (1-3)', present: 0, total: 0 },
      University: { level: 'University', present: 0, total: 0 },
    };

    records.forEach(r => {
      const student = students.find(s => s.id === r.studentId);
      if (!student || student.status !== 'Active') return;

      let key = 'Primary';
      const c = student.currentClass || '';
      if (c.startsWith('Pre') || c.startsWith('Prep')) key = 'PreSchool';
      else if (c.startsWith('Nursery')) key = 'Nursery';
      else if (c.startsWith('Class')) key = 'Primary';
      else if (c.startsWith('JSS')) key = 'JSS';
      else if (c.startsWith('SSS')) key = 'SSS';
      else if (c.startsWith('University')) key = 'University';

      const att = r.terms[3]?.attendance || r.terms[2]?.attendance;
      if (att && levels[key]) {
        levels[key].present += att.presentDays;
        levels[key].total += att.totalDays;
      }
    });

    return Object.values(levels).map(item => {
      const rate = item.total > 0 ? Math.round((item.present / item.total) * 100) : 0;
      return {
        gradeLevel: item.level,
        attendanceRate: rate,
        presentDays: item.present,
        totalDays: item.total
      };
    });
  }, [records, students]);

  const overallAttendanceRate = useMemo(() => {
    const totalPresent = attendanceData.reduce((acc, curr) => acc + curr.presentDays, 0);
    const totalDays = attendanceData.reduce((acc, curr) => acc + curr.totalDays, 0);
    return totalDays > 0 ? Math.round((totalPresent / totalDays) * 100) : 0;
  }, [attendanceData]);

  return (
    <div className="space-y-6" id="dashboard-tab-panel">
      {/* 1. Principal's Notice Component at top of Dashboard */}
      <PrincipalsNoticeBanner variant="dashboard" />

      {/* Flag Accented Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 text-white p-6 md:p-8 shadow-md" id="school-banner-accent">
        {/* Flag representation in background */}
        <div className="absolute top-0 right-0 h-full w-2 flex flex-col">
          <div className="h-1/3 bg-emerald-500"></div>
          <div className="h-1/3 bg-white"></div>
          <div className="h-1/3 bg-blue-500"></div>
        </div>
        <div className="absolute top-0 right-0 h-full w-64 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <img 
            src={SCHOOL_INFO.logo} 
            alt={`${SCHOOL_INFO.name} Crest`} 
            className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white p-1.5 object-contain shadow-lg border border-slate-700 shrink-0"
            referrerPolicy="no-referrer"
          />
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 mb-2">
              <CheckCircle className="w-3.5 h-3.5" /> Sierra Leone National Curriculum Aligned
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-sans">{SCHOOL_INFO.name}</h1>
            <p className="text-indigo-300 font-medium italic text-sm mt-0.5">"{SCHOOL_INFO.motto}"</p>
            <p className="text-slate-300 text-xs md:text-sm mt-2 max-w-xl">
              Welcome to the academic control panel. Managing student profiles, Continuous Assessment (CA) scores, term positions, school fees, and national exams (NPSE, BECE, WASSCE).
            </p>
            <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-400 border-t border-slate-800 pt-3">
              <div><span className="text-slate-200 font-semibold">CEO/Principal:</span> Evangelist Saint Turay</div>
              <div><span className="text-slate-200 font-semibold">Telephone:</span> 034 055410</div>
              <div><span className="text-slate-200 font-semibold">Campus:</span> Kambia 2, Northern Province</div>
              <div><span className="text-slate-200 font-semibold">Academic Cycle:</span> 2025/2026</div>
            </div>
          </div>
        </div>
      </div>

      {/* School Leadership & Governance Section */}
      <div 
        className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4" 
        id="school-leadership-section"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-2xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">School Leadership & Administration</h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Official Governance
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Executive direction, co-founding directorate, and official ministerial contacts
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              Kambia 2 Campus • MBSSE Reg.
            </span>
          </div>
        </div>

        {/* Leadership Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: CEO & Principal Primary Executive Card */}
          <div className="p-4 rounded-xl border-2 border-indigo-200/90 bg-gradient-to-br from-indigo-50/70 via-white to-indigo-50/30 flex flex-col justify-between space-y-3 relative overflow-hidden shadow-2xs">
            <div className="absolute top-0 right-0 transform translate-x-3 -translate-y-3 w-16 h-16 bg-indigo-500/10 rounded-full blur-sm pointer-events-none"></div>
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-indigo-600 text-white shadow-xs">
                  Executive Head
                </span>
                <span className="text-[11px] font-bold text-indigo-700">Co-Founder</span>
              </div>
              
              <div className="flex items-start gap-3 mt-1">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-sm border border-indigo-400">
                  EST
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Executive Head</div>
                  <h4 className="text-base font-black text-slate-900 leading-tight">
                    CEO/Principal: Evangelist Saint Turay
                  </h4>
                  <p className="text-xs font-semibold text-indigo-700 mt-0.5">
                    Givers World Mission Management
                  </p>
                </div>
              </div>

              {/* Explicit Telephone Row */}
              <div className="mt-3.5 p-2.5 bg-white rounded-lg border border-indigo-100 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-700">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold uppercase text-slate-400 block leading-none">Telephone Contact</span>
                    <span className="font-mono text-xs font-black text-slate-900 truncate block mt-0.5">
                      Telephone: 034 055410
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyPhone('034 055410')}
                  className="px-2 py-1 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-[10px] font-bold rounded border border-slate-200 transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                  title="Copy telephone number"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedLeadershipPhone ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-indigo-100/80">
              <a
                href="tel:034055410"
                className="flex-1 py-1.5 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call 034 055410</span>
              </a>
              <a
                href="sms:034055410"
                className="py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
              >
                <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                <span>SMS</span>
              </a>
            </div>
          </div>

          {/* Card 2: Academic Secretariat & Administration */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                  Academic Secretariat
                </span>
                <span className="text-[11px] font-semibold text-slate-500">MBSSE Certified</span>
              </div>

              <div className="space-y-2.5 mt-1 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Vice Principal</span>
                  <p className="font-bold text-slate-800 mt-0.5">{SCHOOL_INFO.vicePrincipalName}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Office of the Bursar & Registrar</span>
                  <p className="font-semibold text-slate-700 mt-0.5">Continuous Assessment, Fees Reconciliation & WAEC Registry</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Campus Administration Line</span>
                  <p className="font-mono text-xs font-bold text-slate-800 mt-0.5">
                    Telephone: 034 055410
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
              <span>Motto: <em className="font-serif font-bold text-slate-700">"{SCHOOL_INFO.motto}"</em></span>
              <span className="font-bold text-slate-600">Est. {SCHOOL_INFO.founded}</span>
            </div>
          </div>

          {/* Card 3: District Campus & Institutional Compliance */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                  Campus Location
                </span>
                <span className="text-[11px] font-semibold text-emerald-700">Northern Province</span>
              </div>

              <div className="space-y-2 mt-1 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Campus Address</span>
                  <p className="font-semibold text-slate-800 mt-0.5 leading-relaxed">
                    {SCHOOL_INFO.address}
                  </p>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200/80 space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500 font-medium">District Directorate:</span>
                    <span className="font-bold text-slate-800">Kambia District</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500 font-medium">School Direct Email:</span>
                    <span className="font-mono text-indigo-700 font-semibold">{SCHOOL_INFO.email}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-medium">Online Web Registry:</span>
              <a
                href={SCHOOL_INFO.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
              >
                <span>Visit Portal</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Administrative Verification Queue (Visible to Admins) */}
      {isAdmin && (
        <VerificationQueue 
          students={students} 
          onUpdateStudent={onUpdateStudent} 
          onNavigate={onNavigate} 
        />
      )}

      {/* Section Header: KPI Metrics Toolbar with Live Sync Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Key Performance Indicators</h2>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
            <span className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`}></span>
            {isSyncing ? 'Recalculating...' : 'Live Metrics Synced'}
          </span>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[11px] text-slate-400">Updated: {lastSyncTime}</span>
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-indigo-300 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            title="Recalculate and refresh KPI metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{isSyncing ? 'Recalculating...' : 'Recalculate'}</span>
          </button>
        </div>
      </div>

      {/* Grid: High-level Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="stats-grid">
        {/* Total Students */}
        <div 
          onClick={() => onNavigate('students')}
          className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden ${isSyncing ? 'animate-shimmer' : ''}`} 
          id="stat-card-students"
        >
          {/* Subtle Top Loading Line */}
          {isSyncing && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-100 dark:bg-slate-800 overflow-hidden z-20">
              <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-striped-progress w-full" />
            </div>
          )}
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Total Enrollment</p>
              <motion.h3 
                key={`students-${totalStudentsCount}-${isSyncing}`}
                initial={{ opacity: 0.6, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1"
              >
                {totalStudentsCount}
              </motion.h3>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">Free Quality Edu</span>
            <span>•</span>
            <span>{maleCount} Boys / {femaleCount} Girls ({femalePercentage}% Girls)</span>
          </div>
          <div className="absolute bottom-0 left-0 h-1 bg-indigo-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
        </div>

        {/* Academic Performance */}
        <div 
          onClick={() => onNavigate('performance')}
          className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden ${isSyncing ? 'animate-shimmer' : ''}`}
          id="stat-card-performance"
        >
          {/* Subtle Top Loading Line */}
          {isSyncing && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-100 dark:bg-slate-800 overflow-hidden z-20">
              <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 animate-striped-progress w-full" />
            </div>
          )}
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">School-Wide Avg</p>
              <motion.h3 
                key={`score-${schoolAverageScore}-${isSyncing}`}
                initial={{ opacity: 0.6, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1"
              >
                {schoolAverageScore}%
              </motion.h3>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600 dark:text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Award className="w-3.5 h-3.5 text-blue-500" />
            <span className="font-semibold text-blue-600 dark:text-blue-400">Satisfactory</span>
            <span>overall standing (Term 3)</span>
          </div>
          <div className="absolute bottom-0 left-0 h-1 bg-blue-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
        </div>

        {/* Exam Candidates */}
        <div 
          onClick={() => onNavigate('performance', { tab: 'exams' })}
          className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden ${isSyncing ? 'animate-shimmer' : ''}`}
          id="stat-card-exams"
        >
          {/* Subtle Top Loading Line */}
          {isSyncing && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-100 dark:bg-slate-800 overflow-hidden z-20">
              <div className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 animate-striped-progress w-full" />
            </div>
          )}
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">National Exams</p>
              <motion.h3 
                key={`exams-${examCandidateCount}-${isSyncing}`}
                initial={{ opacity: 0.6, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1"
              >
                {examCandidateCount}
              </motion.h3>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-950/50 rounded-xl text-purple-600 dark:text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <BookOpen className="w-3.5 h-3.5 text-purple-500 animate-pulse" />
            <span>NPSE, BECE & WASSCE Tracks</span>
          </div>
          <div className="absolute bottom-0 left-0 h-1 bg-purple-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
        </div>

        {/* Fees Ledger Balance */}
        <div 
          onClick={() => onNavigate('fees')}
          className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden ${isSyncing ? 'animate-shimmer' : ''}`}
          id="stat-card-fees"
        >
          {/* Subtle Top Loading Line */}
          {isSyncing && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-100 dark:bg-slate-800 overflow-hidden z-20">
              <div className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 animate-striped-progress w-full" />
            </div>
          )}
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Unpaid Dues</p>
              <motion.h3 
                key={`fees-${totalOutstanding}-${isSyncing}`}
                initial={{ opacity: 0.6, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1"
              >
                SLE {totalOutstanding.toLocaleString()}
              </motion.h3>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>Outstanding tuition term collections</span>
          </div>
          <div className="absolute bottom-0 left-0 h-1 bg-amber-500 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
        </div>
      </div>

      {/* Main Grid: Data Visualization & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Span): Class distribution & High Performers */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section: Term Attendance Trends Line Chart for Entire School Population */}
          <StudentAttendanceTrendsChart records={records} students={students} />

          {/* Section: Academic Performance Trends Across Terms 1, 2, and 3 using Recharts */}
          <PerformanceTrendsCard records={records} students={students} onNavigate={onNavigate} />

          {/* Section: Classroom Performance GPA Distribution */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm" id="classroom-performance-section">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="font-semibold text-slate-800 text-base">Classroom Performance</h3>
                <p className="text-slate-400 text-xs">Distribution of student GPAs across school tiers (calculated on a standard 4.0 scale)</p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0 self-start sm:self-auto">
                <TrendingUp className="w-3.5 h-3.5" /> GPA Analytics Engine
              </div>
            </div>

            {/* Recharts Stacked Bar Chart */}
            <div className="h-72 w-full mt-4" id="gpa-distribution-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={gpaData}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="gradeLevel" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg border border-slate-800 text-xs space-y-1.5 min-w-[200px]">
                            <p className="font-bold border-b border-slate-800 pb-1 mb-1 text-indigo-300">{label} Tier</p>
                            {payload.map((entry) => (
                              <div key={entry.name} className="flex justify-between items-center gap-4">
                                <span className="flex items-center gap-1.5 text-slate-300">
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
                                  {entry.name}:
                                </span>
                                <span className="font-bold">{entry.value} {Number(entry.value) === 1 ? 'student' : 'students'}</span>
                              </div>
                            ))}
                            <div className="border-t border-slate-800 pt-1.5 mt-1.5 flex justify-between font-semibold text-emerald-400">
                              <span>Average GPA:</span>
                              <span>{data.averageGpa.toFixed(2)} / 4.00</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px', fontWeight: 500 }}
                  />
                  <Bar dataKey="High Honors (3.5 - 4.0)" stackId="a" fill="#4f46e5" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Honors (3.0 - 3.49)" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Passing (2.0 - 2.99)" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Needs Support (< 2.0)" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Dynamic Average GPA Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
              {gpaData.map(tier => (
                <div key={tier.gradeLevel} className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{tier.gradeLevel} Avg</span>
                  <span className="text-sm font-black text-slate-800 mt-1 flex items-center gap-1.5">
                    {tier.averageGpa >= 3.0 ? (
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                    )}
                    {tier.averageGpa.toFixed(2)} <span className="text-[9px] text-slate-400 font-normal">GPA</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Term School Attendance Bar Chart Widget */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm" id="attendance-rate-chart-section">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-800 text-base">School Attendance Rate (%)</h3>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Term 3 Active
                  </span>
                </div>
                <p className="text-slate-400 text-xs mt-0.5">Overall student attendance percentage by school level for administrative tracking</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 font-medium">School Average</span>
                  <p className="text-xl font-black text-indigo-600 leading-none">{overallAttendanceRate}%</p>
                </div>
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                  <Users className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Recharts Bar Chart for Attendance */}
            <div className="h-64 w-full mt-4" id="term-attendance-bar-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={attendanceData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="gradeLevel" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    unit="%"
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg border border-slate-800 text-xs space-y-1.5 min-w-[200px]">
                            <p className="font-bold border-b border-slate-800 pb-1 text-indigo-300">{label}</p>
                            <div className="flex justify-between items-center text-emerald-400 font-extrabold text-sm pt-1">
                              <span>Attendance Rate:</span>
                              <span>{data.attendanceRate}%</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-300 text-[11px] pt-1 border-t border-slate-800">
                              <span>Present Days:</span>
                              <span className="font-semibold text-white">{data.presentDays.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-400 text-[11px]">
                              <span>Total Expected:</span>
                              <span className="font-semibold text-slate-200">{data.totalDays.toLocaleString()}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="attendanceRate" name="Attendance Rate (%)" radius={[8, 8, 0, 0]}>
                    {attendanceData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.attendanceRate >= 95 ? '#10b981' : entry.attendanceRate >= 90 ? '#6366f1' : '#f59e0b'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Attendance Tier Breakdown Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
              {attendanceData.map((tier) => (
                <div key={tier.gradeLevel} className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase truncate">{tier.gradeLevel}</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-extrabold text-slate-800 text-sm">{tier.attendanceRate}%</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      tier.attendanceRate >= 95 ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {tier.attendanceRate >= 95 ? 'Excellent' : 'Good'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Academic Class Distribution */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-semibold text-slate-800 text-base">Class Level Distribution</h3>
                <p className="text-slate-400 text-xs">Total students segmented by official school tiers</p>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">Active Cycle</span>
            </div>

            {/* Custom SVG/Bar chart for distribution */}
            <div className="space-y-4">
              {Object.entries(levelCounts).map(([level, count]) => {
                const percentage = totalStudentsCount > 0 ? Math.round((count / totalStudentsCount) * 100) : 0;
                const barColor = levelColors[level as keyof typeof levelColors];
                return (
                  <div key={level} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium text-slate-600">
                      <span className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${barColor}`}></span>
                        {level} {
                          level === 'Pre-School' ? '(Pre 1 - 3)' :
                          level === 'Nursery' ? '(Nursery 1 - 3)' :
                          level === 'Primary' ? '(Class 1 - 6)' :
                          level === 'JSS' ? '(JSS 1 - 3)' :
                          level === 'SSS' ? '(SSS 1 - 3)' :
                          '(Tertiary / Undergrad)'
                        }
                      </span>
                      <span>{count} Students ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${barColor} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Quick action triggers */}
            <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-slate-50 text-xs font-medium">
              <button 
                onClick={() => onNavigate('students')}
                className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-100 transition-colors cursor-pointer"
              >
                <Users className="w-4 h-4 text-indigo-500" /> View Student Files
              </button>
              <button 
                onClick={() => onNavigate('performance')}
                className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-100 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-blue-500" /> Enter Term Marks
              </button>
            </div>
          </div>

          {/* Section: Top Academic Achievers */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-semibold text-slate-800 text-base">Top Academic Achievers</h3>
                <p className="text-slate-400 text-xs">Students demonstrating outstanding overall performance</p>
              </div>
              <button 
                onClick={() => onNavigate('performance')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Full Standings
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {highPerformers.map(({ student, average }) => (
                <div 
                  key={student.id} 
                  onClick={() => onNavigate('report-card', { studentId: student.id })}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-50 hover:border-indigo-100 bg-slate-50/50 hover:bg-indigo-50/10 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    {student.profileImage ? (
                      <img
                        src={student.profileImage}
                        alt={student.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm">{student.name}</h4>
                      <p className="text-slate-400 text-xs">{student.currentClass} {student.stream ? `(${student.stream})` : ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 font-bold text-sm">
                      {average}%
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Average score</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 Span): Financial Health Pie Chart & Fee issues */}
        <div className="space-y-6">
          {/* Financial Health Summary Card with Paid vs Unpaid Pie Chart */}
          <FinancialHealthCard 
            students={students} 
            fees={fees} 
            onNavigate={onNavigate} 
          />

          {/* Section: Pending Fee Payments Visual Alert Widget with Quick-Access List */}
          <PendingFeeAlertWidget 
            students={students} 
            fees={fees} 
            currentTerm={pendingTermFilter}
            onNavigate={onNavigate}
            onOpenNoticeModal={handleOpenNotice}
            onOpenBulkNotice={handleOpenBulkNotice}
          />

          {/* Section: National Exams Preparedness Alerts */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-semibold text-slate-800 text-base mb-1">National Exams Prep</h3>
            <p className="text-slate-400 text-xs mb-4">WAEC candidates and trial metrics</p>
            
            <div className="space-y-4">
              {/* Stat breakdowns */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs pb-4 border-b border-slate-100">
                <div className="p-2 bg-indigo-50 text-indigo-800 rounded-lg">
                  <p className="font-bold text-base">{examPreps.filter(e => e.examType === 'NPSE').length}</p>
                  <p className="text-[10px] text-slate-500">NPSE Class 6</p>
                </div>
                <div className="p-2 bg-blue-50 text-blue-800 rounded-lg">
                  <p className="font-bold text-base">{examPreps.filter(e => e.examType === 'BECE').length}</p>
                  <p className="text-[10px] text-slate-500">BECE JSS 3</p>
                </div>
                <div className="p-2 bg-purple-50 text-purple-800 rounded-lg">
                  <p className="font-bold text-base">{examPreps.filter(e => e.examType === 'WASSCE').length}</p>
                  <p className="text-[10px] text-slate-500">WASSCE SSS 3</p>
                </div>
              </div>

              {/* Action alert: low mock scores */}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 mb-2.5 uppercase tracking-wider">Urgent Intervention List</h4>
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {lowPreps.map(({ student, type, average }) => (
                    <div 
                      key={student.id} 
                      onClick={() => onNavigate('performance', { tab: 'exams', studentId: student.id })}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-rose-100 bg-rose-50/20 hover:bg-rose-50/50 cursor-pointer transition-all"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{student.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{student.currentClass} • WAEC {type}</p>
                      </div>
                      <div className="text-right flex flex-col items-end shrink-0">
                        <span className="text-xs font-bold text-rose-600 px-1.5 py-0.5 rounded bg-rose-50 border border-rose-100">
                          {average}%
                        </span>
                        <span className="text-[9px] text-rose-500 mt-0.5">Critical CA</span>
                      </div>
                    </div>
                  ))}
                  {lowPreps.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-4">All candidates exceeding 55% passing mock average.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section: System Actions & Notices */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-semibold text-slate-800 text-base mb-3">Notice Board</h3>
            
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs">
                <div className="flex gap-2 text-indigo-800 font-semibold mb-1">
                  <CheckCircle className="w-4 h-4 shrink-0 text-indigo-600" />
                  <span>Free Quality School Education Act</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Basic tuition is subsidized. School charges listed here represent specialized learning guides, mock materials, and terminal WAEC administrative processing fees.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100 text-xs">
                <div className="flex gap-2 text-amber-800 font-semibold mb-1">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>WASSCE Registration Deadline</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Sierra Leone WAEC registration portals close shortly. Ensure SSS 3 index numbers are fully uploaded in the Exams tab.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AUTOMATED NOTIFICATION MODAL */}
      {noticeModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-600/40 text-indigo-300 rounded-xl border border-indigo-500/30">
                  <Bell className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">Automated Guardian Fee Notification</h3>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {noticeModal.isBulk 
                      ? `Batch notification for all Unpaid Term ${noticeModal.term} accounts` 
                      : `${noticeModal.student?.name} • Guardian: ${noticeModal.student?.parentName}`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setNoticeModal({ isOpen: false })}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Channel Selector */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => handleChannelSwitch('sms')}
                  className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    noticeChannel === 'sms'
                      ? 'bg-white text-indigo-600 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                  <span>SMS Gateway (Africell / Orange)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleChannelSwitch('email')}
                  className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    noticeChannel === 'email'
                      ? 'bg-white text-indigo-600 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Formal Email Notice</span>
                </button>
              </div>

              {/* Recipient & Balance Snapshot */}
              {noticeModal.student ? (
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Guardian & Phone</span>
                    <p className="font-bold text-slate-800 mt-0.5">{noticeModal.student.parentName}</p>
                    <p className="font-mono text-slate-500 text-[11px]">{noticeModal.student.parentPhone}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Overdue Balance</span>
                    <p className="font-black text-rose-700 text-sm mt-0.5">
                      SLE {noticeModal.balance?.toLocaleString()}
                    </p>
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                      Term {noticeModal.term} Overdue
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Batch Mode: All Unpaid Students in Term {noticeModal.term}</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    This notification template will be addressed and dispatched to guardians of all {pendingFeeStudents.filter(s => s.status === 'Unpaid').length} unpaid students with individualized balance references.
                  </p>
                </div>
              )}

              {/* Editable Notification Template */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-slate-700">Notification Message Template</label>
                  <span className="text-[10px] text-slate-400">
                    {noticeMessageText.length} characters • {noticeChannel === 'sms' ? `${Math.ceil(noticeMessageText.length / 160)} SMS Parts` : 'Email Draft'}
                  </span>
                </div>
                <textarea
                  value={noticeMessageText}
                  onChange={(e) => setNoticeMessageText(e.target.value)}
                  rows={noticeChannel === 'sms' ? 4 : 8}
                  className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 font-sans focus:outline-none focus:border-indigo-500 leading-relaxed resize-none"
                  placeholder="Notification content..."
                />
              </div>

              {/* Payment Methods Info Callout */}
              <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-2 text-xs text-indigo-900">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <span className="font-bold">Sierra Leone Payment Channels:</span> Notice directs guardians to Orange Money ({SCHOOL_INFO.phone}), Africell Money, or the Kambia 2 Bursary Office.
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleCopyNotice}
                className="py-2 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>{copiedNotice ? 'Copied!' : 'Copy Template'}</span>
              </button>

              <div className="flex items-center gap-2">
                {noticeModal.student && noticeChannel === 'sms' && (
                  <a
                    href={`sms:${noticeModal.student.parentPhone}?body=${encodeURIComponent(noticeMessageText)}`}
                    className="py-2 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Open SMS App</span>
                  </a>
                )}

                {noticeModal.student && noticeChannel === 'email' && (
                  <a
                    href={`mailto:guardian@giversworldmission.edu.sl?subject=${encodeURIComponent(`Tuition Fee Notice - ${noticeModal.student.name}`)}&body=${encodeURIComponent(noticeMessageText)}`}
                    className="py-2 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Mail className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Open Email Client</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={handleDispatchNotice}
                  className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{noticeModal.isBulk ? 'Dispatch Batch Reminders' : 'Dispatch Notification'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING SUCCESS NOTIFICATION TOAST */}
      {noticeToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-800 flex items-center gap-3 animate-fadeIn">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0"></div>
          <p className="text-xs font-semibold">{noticeToast}</p>
          <button
            type="button"
            onClick={() => setNoticeToast(null)}
            className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
