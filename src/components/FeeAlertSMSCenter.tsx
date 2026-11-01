/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Send, 
  MessageSquare, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  DollarSign, 
  Search, 
  Filter, 
  Copy, 
  ExternalLink, 
  Download, 
  Printer, 
  RefreshCw, 
  X, 
  Sparkles, 
  ShieldAlert, 
  Check, 
  Eye, 
  Edit3, 
  Clock, 
  Building, 
  CheckSquare, 
  Square,
  Smartphone,
  Share2
} from 'lucide-react';
import { Student, StudentFeeLedger, StudentClass, FeeSmsAlertRecord } from '../types';
import { SCHOOL_INFO } from '../initialData';
import { CLASSES_LIST } from '../constants';
import { motion, AnimatePresence } from 'motion/react';

interface FeeAlertSMSCenterProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  fees: StudentFeeLedger[];
  initialSelectedTerm?: number;
  initialStudentId?: string;
}

const DEFAULT_SMS_TEMPLATES = {
  standard: "Dear {GUARDIAN}, this is an official reminder from {SCHOOL_NAME}. Your ward, {STUDENT} ({CLASS}, {ADMISSION_NO}), has an outstanding Term {TERM} tuition balance of SLE {BALANCE}. Kindly settle this balance at the Bursar's Office or via Orange/Africell Money by {DUE_DATE}. For inquiries, call {SCHOOL_PHONE}. Thank you.",
  urgent: "URGENT FEE NOTICE: Dear {GUARDIAN}, {STUDENT} ({CLASS}) has an overdue tuition balance of SLE {BALANCE} for Term {TERM}. Immediate clearance is required before continuous classes and exams commence. Please contact the Bursar or pay via Mobile Money. {SCHOOL_NAME} Kambia.",
  final_demand: "FINAL DEMAND: Dear {GUARDIAN}, please note that {STUDENT}'s tuition balance of SLE {BALANCE} for Term {TERM} is critically overdue. Settle immediately by {DUE_DATE} to maintain enrollment and transport privileges. Rev. Dr. Nabieu / Bursary, {SCHOOL_NAME}."
};

export default function FeeAlertSMSCenter({
  isOpen,
  onClose,
  students,
  fees,
  initialSelectedTerm = 3,
  initialStudentId
}: FeeAlertSMSCenterProps) {
  // Active Filter States
  const [selectedTerm, setSelectedTerm] = useState<number>(initialSelectedTerm);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Unpaid' | 'Partial'>('All');
  const [classFilter, setClassFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Template & Customization States
  const [templateKey, setTemplateKey] = useState<'standard' | 'urgent' | 'final_demand' | 'custom'>('standard');
  const [customTemplateText, setCustomTemplateText] = useState<string>(DEFAULT_SMS_TEMPLATES.standard);
  const [dueDate, setDueDate] = useState<string>('Friday, End of Week');
  
  // Selection States
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewStudentId, setPreviewStudentId] = useState<string | null>(null);

  // Dispatch Simulation States
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [dispatchProgress, setDispatchProgress] = useState<number>(0);
  const [dispatchStatusText, setDispatchStatusText] = useState<string>('');
  const [dispatchSuccessCount, setDispatchSuccessCount] = useState<number | null>(null);
  const [dispatchLog, setDispatchLog] = useState<Record<string, { timestamp: string; channel: string }>>(() => {
    try {
      const saved = localStorage.getItem('sma_fee_sms_dispatch_log');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Set initial student if provided
  useEffect(() => {
    if (initialStudentId) {
      setSelectedStudentIds([initialStudentId]);
      setPreviewStudentId(initialStudentId);
    }
  }, [initialStudentId]);

  // Handle template change
  const handleTemplateSelect = (key: 'standard' | 'urgent' | 'final_demand' | 'custom') => {
    setTemplateKey(key);
    if (key !== 'custom') {
      setCustomTemplateText(DEFAULT_SMS_TEMPLATES[key]);
    }
  };

  // Insert a tag into customTemplateText
  const insertMergeTag = (tag: string) => {
    setCustomTemplateText(prev => `${prev} ${tag}`);
    setTemplateKey('custom');
  };

  // 1. AUTOMATED FLAGGING OF PENDING FEE BALANCES
  const flaggedStudentsList = useMemo(() => {
    const list: {
      student: Student;
      ledger: StudentFeeLedger;
      term: number;
      totalDue: number;
      paidAmount: number;
      balance: number;
      status: 'Unpaid' | 'Partial';
      hasValidPhone: boolean;
    }[] = [];

    students.forEach(student => {
      if (student.status !== 'Active') return;
      const ledger = fees.find(f => f.studentId === student.id);
      if (!ledger || !ledger.terms || !ledger.terms[selectedTerm]) return;

      const termDetail = ledger.terms[selectedTerm];
      if ((termDetail.status === 'Unpaid' || termDetail.status === 'Partial') && termDetail.balance > 0) {
        // Clean and validate phone (supports +232 Sierra Leone numbers)
        const cleanPhone = (student.parentPhone || '').replace(/\s+/g, '');
        const hasValidPhone = cleanPhone.length >= 8;

        list.push({
          student,
          ledger,
          term: selectedTerm,
          totalDue: termDetail.totalDue,
          paidAmount: termDetail.paidAmount,
          balance: termDetail.balance,
          status: termDetail.status as 'Unpaid' | 'Partial',
          hasValidPhone
        });
      }
    });

    return list;
  }, [students, fees, selectedTerm]);

  // Filtered flagged items based on search and filters
  const filteredFlagged = useMemo(() => {
    return flaggedStudentsList.filter(item => {
      const s = item.student;
      const matchesSearch = 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.parentPhone.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchesClass = classFilter === 'All' || s.currentClass === classFilter;

      return matchesSearch && matchesStatus && matchesClass;
    });
  }, [flaggedStudentsList, searchQuery, statusFilter, classFilter]);

  // Aggregate Metrics
  const totalFlaggedCount = flaggedStudentsList.length;
  const totalPendingAmount = flaggedStudentsList.reduce((sum, item) => sum + item.balance, 0);
  const reachableCount = flaggedStudentsList.filter(item => item.hasValidPhone).length;

  // Initialize all visible items as selected if none selected yet
  useEffect(() => {
    if (selectedStudentIds.length === 0 && filteredFlagged.length > 0) {
      setSelectedStudentIds(filteredFlagged.map(f => f.student.id));
    }
  }, [filteredFlagged.length]);

  // Helper to construct personalized message
  const generatePersonalizedMessage = (
    student: Student,
    balance: number,
    term: number,
    template: string
  ): string => {
    const classDisplay = student.universityProgram
      ? `${student.currentClass} (${student.universityProgram})`
      : student.currentClass;

    return template
      .replace(/{GUARDIAN}/g, student.parentName || 'Guardian')
      .replace(/{STUDENT}/g, student.name)
      .replace(/{CLASS}/g, classDisplay)
      .replace(/{ADMISSION_NO}/g, student.admissionNumber)
      .replace(/{BALANCE}/g, balance.toLocaleString())
      .replace(/{TERM}/g, term.toString())
      .replace(/{DUE_DATE}/g, dueDate)
      .replace(/{SCHOOL_NAME}/g, SCHOOL_INFO.name)
      .replace(/{SCHOOL_PHONE}/g, SCHOOL_INFO.phone || '+232 76 123456');
  };

  // Toggle Selection
  const toggleSelectAll = () => {
    if (selectedStudentIds.length === filteredFlagged.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredFlagged.map(f => f.student.id));
    }
  };

  const toggleSelectStudent = (id: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Copy single message
  const handleCopySingle = (student: Student, balance: number) => {
    const text = generatePersonalizedMessage(student, balance, selectedTerm, customTemplateText);
    navigator.clipboard.writeText(text);
    setCopiedId(student.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Copy all selected messages
  const handleCopyAllSelected = () => {
    const selectedItems = filteredFlagged.filter(f => selectedStudentIds.includes(f.student.id));
    const allText = selectedItems.map(item => {
      const msg = generatePersonalizedMessage(item.student, item.balance, selectedTerm, customTemplateText);
      return `To: ${item.student.parentName} (${item.student.parentPhone}) - Student: ${item.student.name}\n${msg}\n-------------------`;
    }).join('\n\n');

    navigator.clipboard.writeText(allText);
    setCopiedId('ALL');
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Export CSV for Bulk SMS Gateway
  const handleExportCSV = () => {
    const selectedItems = filteredFlagged.filter(f => selectedStudentIds.includes(f.student.id));
    const headers = ['Phone Number', 'Guardian Name', 'Student Name', 'Admission No', 'Class', 'Term', 'Balance Due (SLE)', 'SMS Message Body'];
    
    const rows = selectedItems.map(item => {
      const msg = generatePersonalizedMessage(item.student, item.balance, selectedTerm, customTemplateText);
      return [
        `"${item.student.parentPhone.replace(/"/g, '""')}"`,
        `"${item.student.parentName.replace(/"/g, '""')}"`,
        `"${item.student.name.replace(/"/g, '""')}"`,
        `"${item.student.admissionNumber}"`,
        `"${item.student.currentClass}"`,
        `"${selectedTerm}"`,
        `"${item.balance}"`,
        `"${msg.replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `GWDA_Tuition_SMS_Dispatch_Term${selectedTerm}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Simulate Automated Batch Dispatch through Telecom Gateway (Orange/Africell Sierra Leone)
  const handleSimulateBatchDispatch = () => {
    const selectedItems = filteredFlagged.filter(f => selectedStudentIds.includes(f.student.id));
    if (selectedItems.length === 0) return;

    setIsDispatching(true);
    setDispatchProgress(0);
    setDispatchSuccessCount(null);

    let currentIndex = 0;
    const total = selectedItems.length;

    const interval = setInterval(() => {
      if (currentIndex >= total) {
        clearInterval(interval);
        setIsDispatching(false);
        setDispatchProgress(100);
        setDispatchSuccessCount(total);

        // Update local dispatch logs
        const updatedLog = { ...dispatchLog };
        const nowFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        selectedItems.forEach(item => {
          updatedLog[item.student.id] = {
            timestamp: `Today, ${nowFormatted}`,
            channel: 'SMS Gateway (Orange/Africell SL)'
          };
        });
        setDispatchLog(updatedLog);
        localStorage.setItem('sma_fee_sms_dispatch_log', JSON.stringify(updatedLog));
        return;
      }

      const currentItem = selectedItems[currentIndex];
      currentIndex++;
      const pct = Math.round((currentIndex / total) * 100);
      setDispatchProgress(pct);
      setDispatchStatusText(`Dispatching SMS alert to ${currentItem.student.parentName} (${currentItem.student.parentPhone}) for ${currentItem.student.name}...`);
    }, 180);
  };

  // Print Notice Slips
  const handlePrintSlips = () => {
    const selectedItems = filteredFlagged.filter(f => selectedStudentIds.includes(f.student.id));
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const slipsHtml = selectedItems.map(item => `
      <div style="border: 2px dashed #0f172a; padding: 18px; margin-bottom: 20px; font-family: sans-serif; page-break-inside: avoid; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 12px;">
          <div>
            <h2 style="margin: 0; font-size: 16px; font-weight: 800; color: #065f46;">${SCHOOL_INFO.name}</h2>
            <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">${SCHOOL_INFO.address} • Kambia, Sierra Leone</p>
          </div>
          <div style="text-align: right;">
            <span style="background: #fef2f2; color: #b91c1c; font-weight: bold; font-size: 11px; padding: 3px 8px; border-radius: 4px; border: 1px solid #fca5a5;">OFFICIAL FEE DEMAND SLIP</span>
            <p style="margin: 4px 0 0 0; font-size: 11px; font-weight: 600;">Term ${selectedTerm} • 2025/2026</p>
          </div>
        </div>
        <table style="width: 100%; font-size: 12px; margin-bottom: 12px;">
          <tr>
            <td style="width: 50%;"><strong>Student:</strong> ${item.student.name}</td>
            <td style="width: 50%;"><strong>Admission No:</strong> ${item.student.admissionNumber}</td>
          </tr>
          <tr>
            <td><strong>Current Class:</strong> ${item.student.currentClass}</td>
            <td><strong>Guardian:</strong> ${item.student.parentName} (${item.student.parentPhone})</td>
          </tr>
          <tr>
            <td><strong>Total Term Fee:</strong> SLE ${item.totalDue.toLocaleString()}</td>
            <td><strong>Amount Paid:</strong> SLE ${item.paidAmount.toLocaleString()}</td>
          </tr>
          <tr style="background: #fff1f2;">
            <td colspan="2" style="padding: 6px; font-size: 13px; color: #be123c; font-weight: bold;">
              OUTSTANDING BALANCE DUE: SLE ${item.balance.toLocaleString()}
            </td>
          </tr>
        </table>
        <p style="font-size: 11px; color: #475569; margin: 0 0 8px 0; line-height: 1.4;">
          Please settle this overdue balance at the Bursary or via Orange Money / Africell Money merchant code on or before <strong>${dueDate}</strong> to prevent restriction from academic sessions and term examinations.
        </p>
        <div style="display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 6px;">
          <span>Issued by: Office of the Bursar</span>
          <span>Approved: ${SCHOOL_INFO.principalName}</span>
        </div>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Tuition Fee Demand Slips - Term ${selectedTerm}</title>
          <style>
            @media print { body { padding: 15px; } }
          </style>
        </head>
        <body>
          <h1 style="font-size: 18px; text-align: center; margin-bottom: 20px; font-family: sans-serif;">
            Givers World Mission Diplomats Academy • Outstanding Tuition Slips Batch
          </h1>
          ${slipsHtml}
          <script>
            window.onload = function() { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto" id="automated-fee-sms-center-modal">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Compose Message — Bulk Parent SMS Notifications
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  <span>{totalFlaggedCount} Flagged</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Draft and simulate sending bulk SMS notifications to parents of students with outstanding tuition balances
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            {/* Term Selector */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 text-xs font-bold">
              {[1, 2, 3].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTerm(t)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedTerm === t 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  Term {t}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Main Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* Automated Summary Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
              <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Flagged Balances</p>
              <h4 className="text-xl sm:text-2xl font-black text-rose-700 dark:text-rose-300 mt-1">
                {totalFlaggedCount} Students
              </h4>
              <p className="text-[10px] text-slate-500 mt-1">Unpaid or partial for Term {selectedTerm}</p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
              <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Total Outstanding Dues</p>
              <h4 className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">
                SLE {totalPendingAmount.toLocaleString()}
              </h4>
              <p className="text-[10px] text-slate-500 mt-1">Cumulative pending tuition</p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Reachable Guardians</p>
              <h4 className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                {reachableCount} / {totalFlaggedCount}
              </h4>
              <p className="text-[10px] text-slate-500 mt-1">Valid telephone contacts (+232)</p>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
              <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Selected for Dispatch</p>
              <h4 className="text-xl sm:text-2xl font-black text-indigo-700 dark:text-indigo-300 mt-1">
                {selectedStudentIds.length} Alerts
              </h4>
              <p className="text-[10px] text-slate-500 mt-1">Queued for SMS notification</p>
            </div>
          </div>

          {/* Automated SMS Template Generator Box */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                  Automated SMS Message Template & Tag Engine
                </h3>
              </div>

              {/* Template Preset Selector */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                <span className="text-[11px] text-slate-400 mr-1">Preset:</span>
                <button
                  type="button"
                  onClick={() => handleTemplateSelect('standard')}
                  className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    templateKey === 'standard' 
                      ? 'bg-indigo-600 text-white border-indigo-600' 
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Standard Reminder
                </button>
                <button
                  type="button"
                  onClick={() => handleTemplateSelect('urgent')}
                  className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    templateKey === 'urgent' 
                      ? 'bg-rose-600 text-white border-rose-600' 
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Urgent Exam Clearance
                </button>
                <button
                  type="button"
                  onClick={() => handleTemplateSelect('final_demand')}
                  className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    templateKey === 'final_demand' 
                      ? 'bg-amber-600 text-white border-amber-600' 
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Final Demand
                </button>
              </div>
            </div>

            {/* Template Editable Box */}
            <div className="space-y-2">
              <textarea
                rows={3}
                value={customTemplateText}
                onChange={(e) => {
                  setCustomTemplateText(e.target.value);
                  setTemplateKey('custom');
                }}
                className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-mono leading-relaxed focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="Enter SMS message template with dynamic merge tags..."
              />

              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                {/* Clickable Merge Tags */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Insert Merge Tag:</span>
                  {[
                    '{GUARDIAN}', 
                    '{STUDENT}', 
                    '{CLASS}', 
                    '{ADMISSION_NO}', 
                    '{BALANCE}', 
                    '{TERM}', 
                    '{DUE_DATE}', 
                    '{SCHOOL_PHONE}'
                  ].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => insertMergeTag(tag)}
                      className="px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 text-[10px] font-mono font-bold transition-colors cursor-pointer"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                  <div className="flex items-center gap-1">
                    <span>Due Date:</span>
                    <input 
                      type="text"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-[11px] font-semibold text-slate-700 dark:text-slate-200 w-36"
                    />
                  </div>
                  <span>Length: <strong className="text-slate-700 dark:text-slate-300">{customTemplateText.length}</strong> chars</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    {Math.ceil(customTemplateText.length / 160) || 1} SMS Part(s)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Table Toolbar & Search */}
          <div className="space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  {selectedStudentIds.length === filteredFlagged.length && filteredFlagged.length > 0 ? (
                    <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>{selectedStudentIds.length === filteredFlagged.length ? 'Deselect All' : 'Select All Flagged'}</span>
                </button>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search student, guardian, phone, class..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs w-60 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                {/* Status filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  <option value="All">All Statuses ({flaggedStudentsList.length})</option>
                  <option value="Unpaid">Unpaid Only</option>
                  <option value="Partial">Partial Pay Only</option>
                </select>

                {/* Class filter */}
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  <option value="All">All Classes</option>
                  {CLASSES_LIST.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Action Buttons: Copy All, Export CSV, Print Slips */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyAllSelected}
                  disabled={selectedStudentIds.length === 0}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  title="Copy formatted SMS messages for all selected recipients"
                >
                  {copiedId === 'ALL' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span>{copiedId === 'ALL' ? 'All Copied!' : `Copy SMS (${selectedStudentIds.length})`}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  disabled={selectedStudentIds.length === 0}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  title="Download CSV for Orange/Africell Bulk SMS web portal"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Export CSV</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintSlips}
                  disabled={selectedStudentIds.length === 0}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  title="Generate printed fee reminder demand slips"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Print Slips</span>
                </button>
              </div>
            </div>

            {/* Batch Dispatch Progress Banner */}
            {isDispatching && (
              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 space-y-2 animate-pulse">
                <div className="flex justify-between items-center text-xs font-bold text-indigo-900 dark:text-indigo-200">
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                    <span>Automated SMS Dispatch in Progress ({dispatchProgress}%)</span>
                  </span>
                  <span>{dispatchStatusText}</span>
                </div>
                <div className="w-full bg-indigo-200 dark:bg-indigo-900/60 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full rounded-full transition-all duration-200"
                    style={{ width: `${dispatchProgress}%` }}
                  />
                </div>
              </div>
            )}

            {dispatchSuccessCount !== null && !isDispatching && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Batch Complete: Successfully logged and generated dispatch records for {dispatchSuccessCount} guardians!</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDispatchSuccessCount(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Flagged Accounts Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-700 z-10">
                    <tr>
                      <th className="py-2.5 px-3 w-8">
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.length === filteredFlagged.length && filteredFlagged.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </th>
                      <th className="py-2.5 px-3">Student & Admission</th>
                      <th className="py-2.5 px-3">Class</th>
                      <th className="py-2.5 px-3">Guardian Contact</th>
                      <th className="py-2.5 px-3 text-right">Fee Balance</th>
                      <th className="py-2.5 px-3">Generated SMS Message</th>
                      <th className="py-2.5 px-3 text-center">Alert Status</th>
                      <th className="py-2.5 px-3 text-right">Instant Send</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredFlagged.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                          <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">No Pending Balances Found</p>
                          <p className="text-xs text-slate-400 mt-1">All students in the selected filter have completed their Term {selectedTerm} payments.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredFlagged.map(item => {
                        const s = item.student;
                        const isSelected = selectedStudentIds.includes(s.id);
                        const personalizedMsg = generatePersonalizedMessage(s, item.balance, selectedTerm, customTemplateText);
                        const dispatchInfo = dispatchLog[s.id];
                        const cleanPhone = s.parentPhone.replace(/[^0-9+]/g, '');

                        return (
                          <tr 
                            key={s.id} 
                            className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                              isSelected ? 'bg-indigo-50/20 dark:bg-indigo-950/10' : ''
                            }`}
                          >
                            <td className="py-3 px-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectStudent(s.id)}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                            </td>

                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-900 dark:text-slate-100">{s.name}</div>
                              <div className="font-mono text-[10px] text-slate-400">{s.admissionNumber}</div>
                            </td>

                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {s.currentClass}
                              </span>
                              {s.universityProgram && (
                                <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                  {s.universityProgram}
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-3">
                              <div className="font-semibold text-slate-800 dark:text-slate-200">{s.parentName}</div>
                              <div className="flex items-center gap-1 mt-0.5 text-slate-500 font-mono text-[11px]">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{s.parentPhone}</span>
                              </div>
                            </td>

                            <td className="py-3 px-3 text-right">
                              <div className="font-black text-rose-600 dark:text-rose-400">
                                SLE {item.balance.toLocaleString()}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                of {item.totalDue.toLocaleString()}
                              </div>
                            </td>

                            <td className="py-3 px-3 max-w-xs">
                              <div className="text-[11px] text-slate-600 dark:text-slate-300 truncate max-w-[280px]" title={personalizedMsg}>
                                {personalizedMsg}
                              </div>
                              <button
                                type="button"
                                onClick={() => setPreviewStudentId(s.id)}
                                className="text-[10px] text-indigo-600 hover:text-indigo-700 font-semibold underline mt-0.5"
                              >
                                View full SMS
                              </button>
                            </td>

                            <td className="py-3 px-3 text-center">
                              {dispatchInfo ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>{dispatchInfo.timestamp}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-bold">
                                  <Clock className="w-3 h-3" />
                                  <span>Pending Alert</span>
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Send Native SMS Button */}
                                <a
                                  href={`sms:${cleanPhone}?body=${encodeURIComponent(personalizedMsg)}`}
                                  className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 transition-colors"
                                  title="Send SMS via mobile network"
                                >
                                  <Smartphone className="w-3.5 h-3.5" />
                                </a>

                                {/* Send WhatsApp Button */}
                                <a
                                  href={`https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(personalizedMsg)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900 border border-green-200 dark:border-green-800 transition-colors"
                                  title="Send via WhatsApp"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                </a>

                                {/* Copy SMS */}
                                <button
                                  type="button"
                                  onClick={() => handleCopySingle(s, item.balance)}
                                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                                  title="Copy SMS text"
                                >
                                  {copiedId === s.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Individual Message Preview Modal */}
          {previewStudentId && (
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-indigo-600" />
                  <span>SMS Device Preview for Guardian</span>
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewStudentId(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                >
                  Close Preview
                </button>
              </div>

              {(() => {
                const target = flaggedStudentsList.find(f => f.student.id === previewStudentId);
                if (!target) return null;
                const msg = generatePersonalizedMessage(target.student, target.balance, selectedTerm, customTemplateText);
                return (
                  <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md max-w-lg border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                      <span>To: <strong>{target.student.parentName}</strong> ({target.student.parentPhone})</span>
                      <span className="text-emerald-400 font-mono">Orange SL / Africell</span>
                    </div>
                    <div className="p-3 bg-emerald-950/50 rounded-xl border border-emerald-800/40 text-xs font-mono text-emerald-200 leading-relaxed">
                      {msg}
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                      <span>Recipient: {target.student.name} • {target.student.currentClass}</span>
                      <span>Balance: SLE {target.balance.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <span>
              <strong>{selectedStudentIds.length}</strong> of <strong>{totalFlaggedCount}</strong> flagged guardian contacts selected for dispatch
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleSimulateBatchDispatch}
              disabled={isDispatching || selectedStudentIds.length === 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md shadow-emerald-900/20 hover:shadow-emerald-900/40 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${isDispatching ? 'animate-bounce' : ''}`} />
              <span>
                {isDispatching 
                  ? 'Dispatching SMS Broadcast...' 
                  : `Automated Dispatch (${selectedStudentIds.length} SMS)`}
              </span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
