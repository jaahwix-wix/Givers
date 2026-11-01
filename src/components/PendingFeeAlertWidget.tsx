/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  AlertCircle, 
  DollarSign, 
  Send, 
  MessageSquare, 
  CreditCard, 
  Search, 
  Filter, 
  User, 
  Phone, 
  ChevronRight, 
  CheckCircle2, 
  Sparkles, 
  Copy, 
  ExternalLink,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { Student, StudentFeeLedger } from '../types';
import { getPendingFeeStudents, PendingFeeStudent } from '../utils/feeUtils';

interface PendingFeeAlertWidgetProps {
  students: Student[];
  fees: StudentFeeLedger[];
  currentTerm?: number;
  onNavigate: (tab: string, arg?: any) => void;
  onOpenNoticeModal?: (
    student: Student, 
    balance: number, 
    totalDue: number, 
    term: number, 
    status: 'Unpaid' | 'Partial'
  ) => void;
  onOpenBulkNotice?: (term: number) => void;
}

export default function PendingFeeAlertWidget({
  students,
  fees,
  currentTerm = 3,
  onNavigate,
  onOpenNoticeModal,
  onOpenBulkNotice
}: PendingFeeAlertWidgetProps) {
  const [selectedTerm, setSelectedTerm] = useState<number>(currentTerm);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Unpaid' | 'Partial'>('All');
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Directly call getPendingFeeStudents as required
  const pendingStudentsAll = useMemo(() => {
    return getPendingFeeStudents(students, fees, selectedTerm);
  }, [students, fees, selectedTerm]);

  // Total balance and counts
  const totalOutstanding = useMemo(() => {
    return pendingStudentsAll.reduce((acc, curr) => acc + curr.balance, 0);
  }, [pendingStudentsAll]);

  const unpaidCount = useMemo(() => {
    return pendingStudentsAll.filter(p => p.status === 'Unpaid').length;
  }, [pendingStudentsAll]);

  const partialCount = useMemo(() => {
    return pendingStudentsAll.filter(p => p.status === 'Partial').length;
  }, [pendingStudentsAll]);

  // Filtered by search and status
  const filteredStudents = useMemo(() => {
    return pendingStudentsAll.filter(item => {
      const s = item.student;
      if (!s) return false;
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        (s.name || '').toLowerCase().includes(q) ||
        (s.admissionNumber || '').toLowerCase().includes(q) ||
        (s.currentClass || '').toLowerCase().includes(q) ||
        Boolean(s.parentName && s.parentName.toLowerCase().includes(q)) ||
        Boolean(s.parentPhone && s.parentPhone.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [pendingStudentsAll, searchQuery, statusFilter]);

  const handleCopyPhone = (e: React.MouseEvent, phone: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  return (
    <div 
      className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-amber-300/80 dark:border-amber-600/50 shadow-md p-5 sm:p-6 space-y-4 relative overflow-hidden" 
      id="dashboard-pending-fee-alert-widget"
    >
      {/* Visual Accent Banner */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500"></div>

      {/* Header with Alert Badge and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-b border-amber-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-2xs">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Term {selectedTerm} Fee Outstanding Alert
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                <span>{pendingStudentsAll.length} Pending</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Quick-access monitor tracking students with unpaid or partial tuition dues for the active academic cycle
            </p>
          </div>
        </div>

        {/* Action Controls & Term Selector */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Term Selector */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 text-xs font-bold">
            {[1, 2, 3].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedTerm(t)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedTerm === t 
                    ? 'bg-amber-600 text-white shadow-xs' 
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                Term {t} {t === currentTerm ? '(Current)' : ''}
              </button>
            ))}
          </div>

          {/* Bulk Action Trigger */}
          <button
            type="button"
            onClick={() => {
              if (onOpenBulkNotice) {
                onOpenBulkNotice(selectedTerm);
              } else {
                onNavigate('fees', { openSmsModal: true, initialTerm: selectedTerm });
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Dispatch bulk SMS notifications to all parents with outstanding dues"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Notify All via SMS</span>
          </button>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Outstanding Dues */}
        <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">Total Outstanding</span>
            <div className="text-xl font-black text-amber-900 dark:text-amber-300 mt-0.5">
              SLE {totalOutstanding.toLocaleString()}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>

        {/* Unpaid Count */}
        <div className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-400">Zero Payment (Unpaid)</span>
            <div className="text-xl font-black text-rose-900 dark:text-rose-300 mt-0.5">
              {unpaidCount} <span className="text-xs font-normal text-rose-700 dark:text-rose-400">Students</span>
            </div>
          </div>
          <span className="px-2 py-1 rounded-md bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold">
            Critical
          </span>
        </div>

        {/* Partial Count */}
        <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-400">Partial Clearance</span>
            <div className="text-xl font-black text-indigo-900 dark:text-indigo-300 mt-0.5">
              {partialCount} <span className="text-xs font-normal text-indigo-700 dark:text-indigo-400">Students</span>
            </div>
          </div>
          <span className="px-2 py-1 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
            Installment
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pending students by name, admission no, class, or parent phone..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 self-end sm:self-auto text-xs">
          {(['All', 'Unpaid', 'Partial'] as const).map(status => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-semibold ${
                statusFilter === status
                  ? 'bg-slate-800 text-white dark:bg-amber-600'
                  : 'text-slate-500 hover:text-slate-800 bg-slate-100 dark:bg-slate-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Quick-Access Students List */}
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1" id="pending-students-quick-list">
        {filteredStudents.length > 0 ? (
          filteredStudents.map((item: PendingFeeStudent) => {
            const { student, balance, totalDue, paidAmount, status } = item;
            return (
              <div
                key={student.id}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-600/60 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-amber-50/20 dark:hover:bg-amber-950/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                {/* Student Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800">
                    {student.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 
                        onClick={() => onNavigate('students', { studentId: student.id })}
                        className="font-bold text-xs text-slate-900 dark:text-white truncate hover:text-indigo-600 cursor-pointer"
                      >
                        {student.name}
                      </h4>
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-700">
                        {student.currentClass}
                      </span>
                      {student.universityProgram && (
                        <span className="text-[9px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.2 rounded border border-purple-200 dark:border-purple-800">
                          {student.universityProgram}
                        </span>
                      )}
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                        status === 'Unpaid' 
                          ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900' 
                          : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                      }`}>
                        {status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <span>Adm: <strong className="font-mono text-slate-700 dark:text-slate-300">{student.admissionNumber}</strong></span>
                      {student.parentName && (
                        <span>Guardian: {student.parentName}</span>
                      )}
                      {student.parentPhone && (
                        <button
                          type="button"
                          onClick={(e) => handleCopyPhone(e, student.parentPhone)}
                          className="inline-flex items-center gap-1 font-mono text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                          title="Click to copy telephone"
                        >
                          <Phone className="w-2.5 h-2.5" />
                          <span>{student.parentPhone}</span>
                          {copiedPhone === student.parentPhone && (
                            <span className="text-[9px] font-bold text-emerald-600">Copied!</span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Financial Balance & Action Buttons */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-700">
                  {/* Amount Breakdown */}
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 block leading-none">Term Balance</span>
                    <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                      SLE {balance.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 block leading-none mt-0.5">
                      (Paid SLE {paidAmount.toLocaleString()} of {totalDue.toLocaleString()})
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    {/* Send Single SMS Notice */}
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenNoticeModal) {
                          onOpenNoticeModal(student, balance, totalDue, selectedTerm, status);
                        } else {
                          onNavigate('fees', { studentId: student.id, openSmsModal: true, initialTerm: selectedTerm });
                        }
                      }}
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-2xs"
                      title="Draft & send SMS reminder to guardian"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>

                    {/* Record Payment */}
                    <button
                      type="button"
                      onClick={() => onNavigate('fees', { studentId: student.id, term: selectedTerm })}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                      title="Record tuition payment in Bursary Ledger"
                    >
                      <CreditCard className="w-3 h-3" />
                      <span>Settle Fee</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {pendingStudentsAll.length === 0 
                ? `All Accounts Settled for Term ${selectedTerm}` 
                : 'No pending students match your search criteria'}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {pendingStudentsAll.length === 0 
                ? 'No active students currently have outstanding or partial fee dues for this term.' 
                : 'Try adjusting the search query or status filter above.'}
            </p>
          </div>
        )}
      </div>

      {/* Widget Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
        <span>
          Showing <strong>{filteredStudents.length}</strong> of <strong>{pendingStudentsAll.length}</strong> pending student fee records
        </span>
        <button
          type="button"
          onClick={() => onNavigate('fees', { initialTerm: selectedTerm })}
          className="inline-flex items-center gap-1 font-bold text-amber-700 hover:text-amber-800 dark:text-amber-400 cursor-pointer self-start sm:self-auto"
        >
          <span>Open Full Financials Module</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
