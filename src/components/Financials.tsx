/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  DollarSign, 
  Wallet, 
  FileText, 
  TrendingUp, 
  Clock, 
  Search, 
  Filter, 
  CreditCard,
  PlusCircle,
  X,
  Check,
  Receipt,
  User,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  MessageSquare,
  Send,
  Smartphone,
  AlertCircle
} from 'lucide-react';
import { Student, StudentFeeLedger, FeeTransaction } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import FeeAlertSMSCenter from './FeeAlertSMSCenter';

interface FinancialsProps {
  students: Student[];
  fees: StudentFeeLedger[];
  onAddTransaction: (studentId: string, term: number, tx: Omit<FeeTransaction, 'id'>) => void;
  initialStudentId?: string;
  initialTerm?: number;
  openSmsModal?: boolean;
}

export default function Financials({ students, fees, onAddTransaction, initialStudentId, initialTerm, openSmsModal }: FinancialsProps) {
  
  // State
  const [search, setSearch] = useState('');
  const [selectedTermFilter, setSelectedTermFilter] = useState<1 | 2 | 3>(3);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'All' | 'Paid' | 'Partial' | 'Unpaid'>('All');
  
  // Data operation loading states
  const [isReconciling, setIsReconciling] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Live');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState(0);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  React.useEffect(() => {
    if (initialStudentId) {
      const target = students.find(s => s.id === initialStudentId);
      if (target) {
        setSearch(target.admissionNumber || target.name);
        if (initialTerm) {
          setSelectedTermFilter(initialTerm as 1 | 2 | 3);
        }
      }
    }
  }, [initialStudentId, initialTerm, students]);

  // Trigger subtle loading animation whenever filters or terms change
  const triggerReconciliation = () => {
    setIsReconciling(true);
    setTimeout(() => {
      setIsReconciling(false);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 450);
  };

  React.useEffect(() => {
    triggerReconciliation();
  }, [selectedTermFilter, selectedStatusFilter]);

  // Payment Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [paymentTerm, setPaymentTerm] = useState<1 | 2 | 3>(3);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Bank Deposit' | 'Orange Money' | 'Africell Money' | 'Cash'>('Orange Money');
  const [paymentReceipt, setPaymentReceipt] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // SMS Alert Center State
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [smsTargetStudentId, setSmsTargetStudentId] = useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (openSmsModal) {
      setIsSmsModalOpen(true);
      if (initialStudentId) {
        setSmsTargetStudentId(initialStudentId);
      }
    }
  }, [openSmsModal, initialStudentId]);

  // 1. Core Summary Metrics
  const activeStudents = students.filter(s => s.status === 'Active');
  
  let totalInvoiced = 0;
  let totalReceived = 0;
  let totalOutstanding = 0;

  fees.forEach(ledger => {
    const isStudentActive = activeStudents.some(s => s.id === ledger.studentId);
    if (isStudentActive) {
      Object.values(ledger.terms).forEach(term => {
        totalInvoiced += term.totalDue;
        totalReceived += term.paidAmount;
        totalOutstanding += term.balance;
      });
    }
  });

  // Term Specific Recovery Statistics
  const termStats = React.useMemo(() => {
    let termInvoiced = 0;
    let termCollected = 0;
    let paidCount = 0;
    let partialCount = 0;
    let unpaidCount = 0;

    activeStudents.forEach(st => {
      const ledger = fees.find(f => f.studentId === st.id);
      if (ledger && ledger.terms && ledger.terms[selectedTermFilter]) {
        const t = ledger.terms[selectedTermFilter];
        termInvoiced += t.totalDue;
        termCollected += t.paidAmount;
        if (t.status === 'Paid' || t.balance <= 0) paidCount++;
        else if (t.status === 'Partial') partialCount++;
        else unpaidCount++;
      } else {
        unpaidCount++;
      }
    });

    const recoveryRate = termInvoiced > 0 ? Math.round((termCollected / termInvoiced) * 100) : 0;
    const outstandingRate = Math.max(0, 100 - recoveryRate);

    return {
      invoiced: termInvoiced,
      collected: termCollected,
      outstanding: Math.max(0, termInvoiced - termCollected),
      recoveryRate,
      outstandingRate,
      paidCount,
      partialCount,
      unpaidCount,
      totalCount: activeStudents.length
    };
  }, [activeStudents, fees, selectedTermFilter]);

  // Automated flagged count for pending fees
  const flaggedPendingCount = React.useMemo(() => {
    return fees.filter(f => {
      const s = students.find(stud => stud.id === f.studentId);
      if (!s || s.status !== 'Active') return false;
      const termFee = f.terms[selectedTermFilter];
      return termFee && (termFee.status === 'Unpaid' || termFee.status === 'Partial') && termFee.balance > 0;
    }).length;
  }, [fees, students, selectedTermFilter]);

  // Academic Tier Collection Progress Calculation
  const tierStats = React.useMemo(() => {
    const tiers = [
      { key: 'pre', name: 'Pre-School (Pre 1-3)', match: (c?: string) => (c || '').startsWith('Pre') || (c || '').startsWith('Prep') },
      { key: 'nursery', name: 'Nursery (Nursery 1-3)', match: (c?: string) => (c || '').startsWith('Nursery') },
      { key: 'primary', name: 'Primary (Class 1-6)', match: (c?: string) => (c || '').startsWith('Class') },
      { key: 'jss', name: 'Junior Secondary (JSS 1-3)', match: (c?: string) => (c || '').startsWith('JSS') },
      { key: 'sss', name: 'Senior Secondary (SSS 1-3)', match: (c?: string) => (c || '').startsWith('SSS') },
      { key: 'university', name: 'University & Tertiary', match: (c?: string) => (c || '').startsWith('University') },
    ];

    return tiers.map(tier => {
      let tierInvoiced = 0;
      let tierCollected = 0;
      let count = 0;

      activeStudents.forEach(st => {
        if (tier.match(st.currentClass)) {
          count++;
          const ledger = fees.find(f => f.studentId === st.id);
          if (ledger && ledger.terms[selectedTermFilter]) {
            tierInvoiced += ledger.terms[selectedTermFilter].totalDue;
            tierCollected += ledger.terms[selectedTermFilter].paidAmount;
          }
        }
      });

      const rate = tierInvoiced > 0 ? Math.round((tierCollected / tierInvoiced) * 100) : 0;
      return {
        name: tier.name,
        studentsCount: count,
        invoiced: tierInvoiced,
        collected: tierCollected,
        rate
      };
    });
  }, [activeStudents, fees, selectedTermFilter]);

  // Handle Recording New Payment with interactive operation progress
  const handleRecordPaymentClick = (studentId: string) => {
    const sLedger = fees.find(l => l.studentId === studentId);
    setSelectedStudentId(studentId);
    setPaymentTerm(selectedTermFilter);
    
    // Suggest the remaining balance for the term
    const termBalance = sLedger?.terms[selectedTermFilter]?.balance || 0;
    setPaymentAmount(termBalance);
    setPaymentReceipt(`NS-REC-${Math.floor(100000 + Math.random() * 900000)}`);
    setPaymentSuccess(false);
    setIsSubmittingPayment(false);
    setSubmissionProgress(0);
    setPaymentError(null);
    setIsModalOpen(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || paymentAmount <= 0) {
      setPaymentError('Please enter a valid student and payment amount greater than 0.');
      return;
    }
    setPaymentError(null);

    // Step 1: Trigger smooth loading progress
    setIsSubmittingPayment(true);
    setSubmissionProgress(30);

    setTimeout(() => {
      setSubmissionProgress(75);
    }, 200);

    setTimeout(() => {
      setSubmissionProgress(100);
      setPaymentSuccess(true);

      onAddTransaction(selectedStudentId, paymentTerm, {
        date: new Date().toISOString().split('T')[0],
        amount: paymentAmount,
        paymentMethod,
        receiptNumber: paymentReceipt || `NS-REC-${Date.now().toString().slice(-6)}`
      });

      setTimeout(() => {
        setIsSubmittingPayment(false);
        setPaymentSuccess(false);
        setSubmissionProgress(0);
        setIsModalOpen(false);
        triggerReconciliation();
      }, 600);
    }, 500);
  };

  // Filter students ledger
  const filteredLedgers = fees.filter(ledger => {
    const student = students.find(s => s.id === ledger.studentId);
    if (!student || student.status !== 'Active') return false;

    const matchesSearch = student.name.toLowerCase().includes(search.toLowerCase()) || 
                          student.admissionNumber.toLowerCase().includes(search.toLowerCase());

    const termStatus = ledger.terms[selectedTermFilter]?.status || 'Unpaid';
    const matchesStatus = selectedStatusFilter === 'All' || termStatus === selectedStatusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6" id="fees-ledger-tab-panel">
      {/* Top Controls Toolbar with Live Reconcile Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2.5">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Tuition & Financial Management</h2>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
            <span className={`w-1.5 h-1.5 rounded-full ${isReconciling ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`}></span>
            {isReconciling ? 'Recalculating Progress...' : 'Ledger Synced'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Compose Message Button for Bulk SMS to Parents with Outstanding Fees */}
          <button
            type="button"
            id="compose-sms-message-btn"
            onClick={() => {
              setSmsTargetStudentId(undefined);
              setIsSmsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
            title="Compose and draft bulk SMS notifications to parents of students with outstanding fees"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Compose Message</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-white text-[10px] font-bold">
              Bulk SMS
            </span>
          </button>

          {/* Automated SMS Fee Alert Center Action */}
          <button
            type="button"
            onClick={() => {
              setSmsTargetStudentId(undefined);
              setIsSmsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 rounded-xl transition-all cursor-pointer shadow-xs"
            title="Open Automated Fee Balance Flagging & Guardian SMS Alert Dispatcher"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Guardian SMS Alerts</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white text-rose-700 text-[10px] font-black">
              {flaggedPendingCount} Flagged
            </span>
          </button>

          <span className="text-[11px] text-slate-400 hidden md:inline">Term {selectedTermFilter} Active • Updated: {lastSyncTime}</span>
          <button
            type="button"
            onClick={triggerReconciliation}
            disabled={isReconciling}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-indigo-300 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            title="Recalculate and reconcile fees progress"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReconciling ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{isReconciling ? 'Syncing...' : 'Reconcile'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Ribbon with Animated Progress Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="fees-metrics-grid">
        {/* Total Invoiced */}
        <div className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all ${isReconciling ? 'animate-shimmer' : ''}`}>
          {isReconciling && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-100 dark:bg-slate-800 overflow-hidden z-20">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 animate-striped-progress w-full" />
            </div>
          )}
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Term Invoices</p>
              <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">SLE {totalInvoiced.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-3 flex items-center justify-between">
            <span>Across Pre 1 to University tracks</span>
            <span className="font-semibold text-slate-600 dark:text-slate-300">{activeStudents.length} Active Accounts</span>
          </p>
        </div>

        {/* Total Collected with Recovery Rate Progress Bar */}
        <div className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all ${isReconciling ? 'animate-shimmer' : ''}`}>
          {isReconciling && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-100 dark:bg-slate-800 overflow-hidden z-20">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 animate-striped-progress w-full" />
            </div>
          )}
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Paid Collections</p>
              <h3 className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">SLE {totalReceived.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          
          {/* Subtle Progress Bar for Recovery Rate */}
          <div className="mt-3 space-y-1.5">
            <div className="flex justify-between items-center text-[11px]">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Recovery Rate</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {totalInvoiced > 0 ? Math.round((totalReceived / totalInvoiced) * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
              <motion.div 
                className={`h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full ${isReconciling ? 'animate-striped-progress' : ''}`}
                initial={{ width: 0 }}
                animate={{ width: `${totalInvoiced > 0 ? Math.round((totalReceived / totalInvoiced) * 100) : 0}%` }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>

        {/* Outstanding tuition fees with Progress Bar */}
        <div className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all ${isReconciling ? 'animate-shimmer' : ''}`}>
          {isReconciling && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-100 dark:bg-slate-800 overflow-hidden z-20">
              <div className="h-full bg-gradient-to-r from-amber-500 to-rose-500 animate-striped-progress w-full" />
            </div>
          )}
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Outstanding Balances</p>
              <h3 className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">SLE {totalOutstanding.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
          </div>

          {/* Subtle Progress Bar for Outstanding Portion */}
          <div className="mt-3 space-y-1.5">
            <div className="flex justify-between items-center text-[11px]">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Uncollected Portion</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">
                {totalInvoiced > 0 ? Math.round((totalOutstanding / totalInvoiced) * 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
              <motion.div 
                className={`h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full ${isReconciling ? 'animate-striped-progress' : ''}`}
                initial={{ width: 0 }}
                animate={{ width: `${totalInvoiced > 0 ? Math.round((totalOutstanding / totalInvoiced) * 100) : 0}%` }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Institutional Term Fee Progress & Recovery Breakdown Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Term {selectedTermFilter} Collection Progress & Academic Tier Breakdown</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                Recovery: {termStats.recoveryRate}%
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              SLE {termStats.collected.toLocaleString()} collected of SLE {termStats.invoiced.toLocaleString()} scheduled dues
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-slate-600 dark:text-slate-300 font-medium">Full ({termStats.paidCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-slate-600 dark:text-slate-300 font-medium">Partial ({termStats.partialCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span className="text-slate-600 dark:text-slate-300 font-medium">Unpaid ({termStats.unpaidCount})</span>
            </div>
          </div>
        </div>

        {/* Multi-Segment Stacked Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-300">Term Payment Distribution</span>
            <span className="text-slate-400 text-[11px]">{termStats.totalCount} Active Students</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden flex p-0.5 border border-slate-200/60 dark:border-slate-700/60">
            {termStats.paidCount > 0 && (
              <motion.div 
                title={`Fully Paid: ${termStats.paidCount} students`}
                className={`bg-emerald-500 h-full rounded-l-full ${isReconciling ? 'animate-striped-progress' : ''}`}
                initial={{ width: 0 }}
                animate={{ width: `${(termStats.paidCount / (termStats.totalCount || 1)) * 100}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            )}
            {termStats.partialCount > 0 && (
              <motion.div 
                title={`Partial: ${termStats.partialCount} students`}
                className={`bg-amber-500 h-full ${isReconciling ? 'animate-striped-progress' : ''}`}
                initial={{ width: 0 }}
                animate={{ width: `${(termStats.partialCount / (termStats.totalCount || 1)) * 100}%` }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
              />
            )}
            {termStats.unpaidCount > 0 && (
              <motion.div 
                title={`Unpaid: ${termStats.unpaidCount} students`}
                className={`bg-rose-500 h-full rounded-r-full ${isReconciling ? 'animate-striped-progress' : ''}`}
                initial={{ width: 0 }}
                animate={{ width: `${(termStats.unpaidCount / (termStats.totalCount || 1)) * 100}%` }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
              />
            )}
          </div>
        </div>

        {/* Tier-by-Tier Progress Bars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {tierStats.map((tier, idx) => (
            <div 
              key={tier.name} 
              className={`p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 transition-all ${isReconciling ? 'animate-shimmer' : ''}`}
            >
              <div className="flex justify-between items-start text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{tier.name}</span>
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{tier.rate}%</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                SLE {tier.collected.toLocaleString()} / SLE {tier.invoiced.toLocaleString()}
              </p>
              
              {/* Progress Bar for Tier */}
              <div className="w-full bg-slate-200/60 dark:bg-slate-700/60 h-2 rounded-full overflow-hidden mt-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${tier.rate}%` }}
                  transition={{ duration: 0.6, delay: idx * 0.08, ease: 'easeOut' }}
                  className={`h-full rounded-full ${
                    tier.rate >= 75 
                      ? 'bg-emerald-500' 
                      : tier.rate >= 40 
                        ? 'bg-indigo-500' 
                        : 'bg-amber-500'
                  } ${isReconciling ? 'animate-striped-progress' : ''}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter and Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Table Filter controls */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Student Accounts Registry</h3>
            <p className="text-slate-400 text-xs">Track payments and balance summaries term-by-term</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input 
                type="text" 
                placeholder="Search Student..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs w-48 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Term Filter */}
            <select
              value={selectedTermFilter}
              onChange={(e) => setSelectedTermFilter(parseInt(e.target.value) as any)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none"
            >
              <option value="1">Term 1 accounts</option>
              <option value="2">Term 2 accounts</option>
              <option value="3">Term 3 accounts</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none"
            >
              <option value="All">All statuses</option>
              <option value="Paid">Fully Paid</option>
              <option value="Partial">Partial Pay</option>
              <option value="Unpaid">Unpaid</option>
            </select>

            {/* Quick Compose Message Trigger */}
            <button
              type="button"
              onClick={() => {
                setSmsTargetStudentId(undefined);
                setIsSmsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 rounded-xl transition-all cursor-pointer shadow-2xs"
              title="Compose bulk SMS to parents of students with outstanding fees"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Compose Message</span>
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/40">
                <th className="py-3 px-5">Student / Admission ID</th>
                <th className="py-3 px-5 text-center">Class</th>
                <th className="py-3 px-5 text-center">Total Fee (Due)</th>
                <th className="py-3 px-5 text-center">Paid Amount</th>
                <th className="py-3 px-5 text-center">Balance Due</th>
                <th className="py-3 px-5 text-center">Payment Progress</th>
                <th className="py-3 px-5 text-center">Status</th>
                <th className="py-3 px-5 text-right">Accounting Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-600 dark:text-slate-300">
              {filteredLedgers.map((ledger) => {
                const student = students.find(s => s.id === ledger.studentId)!;
                const termDetail = ledger.terms[selectedTermFilter] || { totalDue: 0, paidAmount: 0, balance: 0, status: 'Unpaid' as const };
                
                const badgeColor = termDetail.status === 'Paid' 
                  ? 'text-indigo-700 bg-indigo-50 border-indigo-100 dark:text-indigo-300 dark:bg-indigo-950/40 dark:border-indigo-900/50' 
                  : termDetail.status === 'Partial'
                    ? 'text-amber-700 bg-amber-50 border-amber-100 dark:text-amber-300 dark:bg-amber-950/40 dark:border-amber-900/50'
                    : 'text-rose-700 bg-rose-50 border-rose-100 dark:text-rose-300 dark:bg-rose-950/40 dark:border-rose-900/50';

                const progressPercent = termDetail.totalDue > 0
                  ? Math.min(100, Math.round((termDetail.paidAmount / termDetail.totalDue) * 100))
                  : 0;

                return (
                  <tr key={ledger.studentId} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/30 transition-colors">
                    {/* Student Identity */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300 shrink-0">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{student.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{student.admissionNumber}</p>
                        </div>
                      </div>
                    </td>

                    {/* Class */}
                    <td className="py-3.5 px-5 text-center font-bold text-slate-700 dark:text-slate-200">
                      {student.currentClass}
                    </td>

                    {/* Due */}
                    <td className="py-3.5 px-5 text-center font-mono">
                      SLE {termDetail.totalDue.toLocaleString()}
                    </td>

                    {/* Paid */}
                    <td className="py-3.5 px-5 text-center font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                      SLE {termDetail.paidAmount.toLocaleString()}
                    </td>

                    {/* Balance */}
                    <td className="py-3.5 px-5 text-center font-mono text-rose-600 dark:text-rose-400 font-bold">
                      SLE {termDetail.balance.toLocaleString()}
                    </td>

                    {/* Payment Progress Bar */}
                    <td className="py-3.5 px-5 text-center">
                      <div className="inline-flex flex-col items-center w-28">
                        <div className="flex justify-between w-full text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                          <span className="font-bold">{progressPercent}%</span>
                          <span className="text-[9px] text-slate-400">
                            {termDetail.paidAmount > 0 ? `SLE ${termDetail.paidAmount.toLocaleString()}` : 'None'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className={`h-full rounded-full ${
                              progressPercent >= 100 
                                ? 'bg-emerald-500' 
                                : progressPercent > 0 
                                  ? 'bg-amber-500' 
                                  : 'bg-slate-300 dark:bg-slate-700'
                            } ${isReconciling ? 'animate-striped-progress' : ''}`}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="py-3.5 px-5 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${badgeColor}`}>
                        {termDetail.status}
                      </span>
                    </td>

                    {/* Payment Trigger & SMS */}
                    <td className="py-3.5 px-5 text-right">
                      {termDetail.balance > 0 ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSmsTargetStudentId(student.id);
                              setIsSmsModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 py-1 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 font-bold text-[10px] border border-rose-200 dark:border-rose-900/50 cursor-pointer transition-colors"
                            title={`Send automated SMS fee reminder to ${student.parentName} (${student.parentPhone})`}
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>SMS Alert</span>
                          </button>

                          <button
                            onClick={() => handleRecordPaymentClick(student.id)}
                            className="inline-flex items-center gap-1 py-1 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] shadow-xs cursor-pointer transition-colors"
                          >
                            <PlusCircle className="w-3 h-3" /> Post Pay
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-semibold flex items-center justify-end gap-1">
                          <Check className="w-3.5 h-3.5 text-indigo-500" /> Accounts Cleared
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredLedgers.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 bg-slate-50/50 dark:bg-slate-800/20">
                    <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    No financial ledger matches the selection parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Entry Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" id="payment-entry-modal">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-base">Record Tuition Payment</h3>
                  <p className="text-slate-400 text-xs">Post manual or mobile money receipts to ledger</p>
                </div>
                {!isSubmittingPayment && (
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="p-1 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {isSubmittingPayment ? (
                /* Subtle Animated Loading State during Payment Submission */
                <div className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center mx-auto">
                    {paymentSuccess ? (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                        <ShieldCheck className="w-9 h-9 text-emerald-500" />
                      </motion.div>
                    ) : (
                      <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                      {paymentSuccess ? 'Transaction Confirmed & Recorded!' : 'Securing Ledger Transaction...'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {paymentSuccess 
                        ? 'Official financial voucher and balance status updated' 
                        : 'Validating receipt reference and updating student terminal balance'}
                    </p>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-500 rounded-full animate-striped-progress"
                      initial={{ width: '10%' }}
                      animate={{ width: `${submissionProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    Posting SLE {paymentAmount.toLocaleString()} via {paymentMethod}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSavePayment} className="p-6 space-y-4">
                  {paymentError && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                      <span>{paymentError}</span>
                    </div>
                  )}

                  {/* Selected student details */}
                  {selectedStudentId && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                      <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 rounded-lg">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          {students.find(s => s.id === selectedStudentId)?.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Class: {students.find(s => s.id === selectedStudentId)?.currentClass} • Admin ID: {students.find(s => s.id === selectedStudentId)?.admissionNumber}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Term Selector */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Academic Term Segment</label>
                    <select
                      value={paymentTerm}
                      onChange={(e) => {
                        const termValue = parseInt(e.target.value) as 1 | 2 | 3;
                        setPaymentTerm(termValue);
                        // Suggest the balance for the newly selected term
                        const sLedger = fees.find(l => l.studentId === selectedStudentId);
                        const balanceValue = sLedger?.terms[termValue]?.balance || 0;
                        setPaymentAmount(balanceValue);
                      }}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 bg-white dark:bg-slate-800 cursor-pointer"
                    >
                      <option value="1">Term 1 dues</option>
                      <option value="2">Term 2 dues</option>
                      <option value="3">Term 3 dues</option>
                    </select>
                  </div>

                  {/* Payment Amount */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Transaction Amount (SLE)</label>
                    <div className="relative">
                      <span className="text-xs font-bold text-slate-400 absolute left-3 top-2.5">SLE</span>
                      <input 
                        type="number" 
                        required
                        min="1"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <p className="text-[9px] text-slate-400">
                      Max suggested term balance: SLE {fees.find(l => l.studentId === selectedStudentId)?.terms[paymentTerm]?.balance || 0}
                    </p>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Receipting Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 bg-white dark:bg-slate-800 cursor-pointer"
                    >
                      <option value="Orange Money">Orange Money Transfer</option>
                      <option value="Africell Money">Africell Money Transfer</option>
                      <option value="Bank Deposit">Commercial Bank Deposit Slip</option>
                      <option value="Cash">Physical Cash Registrar</option>
                    </select>
                  </div>

                  {/* Receipt Number */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Receipt / Transaction Reference</label>
                    <div className="relative">
                      <Receipt className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input 
                        type="text" 
                        required
                        value={paymentReceipt}
                        onChange={(e) => setPaymentReceipt(e.target.value)}
                        placeholder="e.g. SLMB-8490321"
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>

                  {/* Submission triggers */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Post Transaction
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Automated Fee Balance Flagging & Guardian SMS Dispatcher Modal */}
      <FeeAlertSMSCenter
        isOpen={isSmsModalOpen}
        onClose={() => {
          setIsSmsModalOpen(false);
          setSmsTargetStudentId(undefined);
        }}
        students={students}
        fees={fees}
        initialSelectedTerm={selectedTermFilter}
        initialStudentId={smsTargetStudentId}
      />
    </div>
  );
}
