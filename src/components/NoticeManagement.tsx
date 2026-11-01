/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  BellRing, 
  Send, 
  Smartphone, 
  Users, 
  ShieldCheck, 
  CheckCircle2, 
  Filter, 
  Search, 
  MessageSquare, 
  Calendar, 
  UserCheck, 
  Sparkles, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  Check, 
  RefreshCw, 
  Printer, 
  Download, 
  Eye, 
  PlusCircle, 
  X,
  FileText,
  Radio,
  Building,
  GraduationCap
} from 'lucide-react';
import { Student, StudentClass, ClassNotice, NoticeSmsLog, UserRole } from '../types';
import { SCHOOL_INFO } from '../initialData';
import { CLASSES_LIST } from '../constants';
import { useAuth } from '../context/AuthContext';
import { 
  getSavedClassNotices, 
  getSavedNoticeSmsLogs, 
  broadcastNoticeSMS, 
  BroadcastResult 
} from '../utils/smsNoticeUtils';
import { motion, AnimatePresence } from 'motion/react';

interface NoticeManagementProps {
  students: Student[];
}

export default function NoticeManagement({ students }: NoticeManagementProps) {
  const { user, role, can } = useAuth();
  const canPublishNotice = role === 'admin' || role === 'teacher';

  // Notices and SMS Logs state
  const [notices, setNotices] = useState<ClassNotice[]>(() => getSavedClassNotices());
  const [smsLogs, setSmsLogs] = useState<NoticeSmsLog[]>(() => getSavedNoticeSmsLogs());

  // Active View Tab
  const [activeTab, setActiveTab] = useState<'bulletins' | 'sms-logs'>('bulletins');

  // Filters
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('All');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Compose Modal State
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [formTargetClass, setFormTargetClass] = useState<StudentClass | 'All Classes'>('SSS 3');
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formPriority, setFormPriority] = useState<ClassNotice['priority']>('Official Directive');
  const [formCategory, setFormCategory] = useState<ClassNotice['category']>('Academic');

  // SMS Live Dispatch Animation Overlay
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchProgress, setDispatchProgress] = useState(0);
  const [dispatchDetails, setDispatchDetails] = useState<BroadcastResult | null>(null);
  const [selectedNoticeForAudit, setSelectedNoticeForAudit] = useState<ClassNotice | null>(null);

  // SMS Preview State in modal
  const [previewRecipientType, setPreviewRecipientType] = useState<'student' | 'parent'>('student');

  // Success Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Synchronize notices & logs across tabs and updates
  useEffect(() => {
    const handleUpdate = () => {
      setNotices(getSavedClassNotices());
      setSmsLogs(getSavedNoticeSmsLogs());
    };
    window.addEventListener('sma_class_notice_dispatched', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('sma_class_notice_dispatched', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Compute student & parent counts for selected target class in compose form
  const composeTargetStats = useMemo(() => {
    if (formTargetClass === 'All Classes') {
      const activeStuds = students.filter(s => s.status === 'Active');
      const count = activeStuds.length > 0 ? activeStuds.length : 120;
      return { studentsCount: count, parentsCount: count, totalSMS: count * 2 };
    }
    const classStuds = students.filter(s => s.status === 'Active' && s.currentClass === formTargetClass);
    const count = classStuds.length > 0 ? classStuds.length : 24;
    return { studentsCount: count, parentsCount: count, totalSMS: count * 2 };
  }, [formTargetClass, students]);

  // Handle Notice Publishing with SMS Broadcast
  const handlePublishNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) return;

    setIsDispatching(true);
    setDispatchProgress(15);

    const authorName = user?.displayName || (role === 'admin' ? SCHOOL_INFO.principalName : 'Class Form Teacher');
    const authorRole = role === 'admin' ? 'admin' : 'teacher';

    const newNotice: ClassNotice = {
      id: `notice-gwm-${Date.now()}`,
      title: formTitle.trim(),
      content: formContent.trim(),
      author: authorName,
      authorRole,
      authorEmail: user?.email || 'staff@giversworldmission.edu.sl',
      targetClass: formTargetClass,
      priority: formPriority,
      category: formCategory,
      isPinned: formPriority === 'Urgent Executive Order' || formPriority === 'Official Directive',
      createdAt: new Date().toISOString(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      smsBroadcast: {
        totalRecipients: 0,
        studentCount: 0,
        parentCount: 0,
        deliveredCount: 0,
        status: 'Broadcasting',
        sentAt: 'Sending now...',
        carrier: 'Sierra Leone GSM Gateway'
      }
    };

    // Step-by-step progress simulation for realistic carrier dispatch
    setTimeout(() => setDispatchProgress(45), 300);
    setTimeout(() => setDispatchProgress(80), 650);

    setTimeout(() => {
      const result = broadcastNoticeSMS(newNotice, students);
      setDispatchProgress(100);
      setDispatchDetails(result);
      setNotices(getSavedClassNotices());
      setSmsLogs(getSavedNoticeSmsLogs());

      // Reset form
      setFormTitle('');
      setFormContent('');
      setIsComposeOpen(false);

      setToastMessage(`Notice published! ${result.totalSent} SMS messages dispatched to students and parents in ${formTargetClass}.`);
      setTimeout(() => setToastMessage(null), 5000);
    }, 1100);
  };

  // Filtered Notices list
  const filteredNotices = useMemo(() => {
    return notices.filter(notice => {
      const matchesClass = selectedClassFilter === 'All' || notice.targetClass === selectedClassFilter || notice.targetClass === 'All Classes';
      const matchesPriority = selectedPriorityFilter === 'All' || notice.priority === selectedPriorityFilter;
      const matchesQuery = searchQuery === '' || 
        notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notice.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notice.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notice.targetClass.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesClass && matchesPriority && matchesQuery;
    });
  }, [notices, selectedClassFilter, selectedPriorityFilter, searchQuery]);

  // Filtered SMS Logs
  const filteredSmsLogs = useMemo(() => {
    return smsLogs.filter(log => {
      const matchesClass = selectedClassFilter === 'All' || log.currentClass === selectedClassFilter;
      const matchesQuery = searchQuery === '' ||
        log.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.phoneNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.noticeTitle.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesClass && matchesQuery;
    });
  }, [smsLogs, selectedClassFilter, searchQuery]);

  // Overall Statistics
  const stats = useMemo(() => {
    const totalNotices = notices.length;
    const totalSmsSent = smsLogs.length > 0 ? smsLogs.length : notices.reduce((acc, n) => acc + (n.smsBroadcast?.totalRecipients || 0), 0);
    const studentSms = smsLogs.filter(l => l.recipientType === 'Student').length || Math.floor(totalSmsSent / 2);
    const parentSms = smsLogs.filter(l => l.recipientType === 'Parent/Guardian').length || Math.ceil(totalSmsSent / 2);
    return {
      totalNotices,
      totalSmsSent,
      studentSms,
      parentSms,
      deliveryRate: '99.8%'
    };
  }, [notices, smsLogs]);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn" id="notice-management-module">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 border-2 border-amber-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-amber-400 text-slate-950 shadow-xs">
                <Smartphone className="w-3.5 h-3.5" /> Automated Carrier SMS
              </span>
              <span className="text-xs font-bold text-amber-300 border border-amber-400/20 px-2.5 py-0.5 rounded-full bg-amber-500/10">
                Orange SL & Africell GSM Gateway
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Class Noticeboard & Instant SMS Broadcast Center
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Every official notice posted by teachers or the Principal automatically broadcasts personalized SMS alerts to each pupil and their guardian in the targeted class.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {canPublishNotice && (
              <button
                type="button"
                onClick={() => setIsComposeOpen(true)}
                className="flex items-center gap-2 px-5 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm rounded-xl shadow-md transition-all transform active:scale-95 cursor-pointer"
                id="compose-notice-sms-btn"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Post Notice & Send SMS</span>
              </button>
            )}
          </div>
        </div>

        {/* Real-time KPI Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-3.5 border border-white/5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Official Notices</span>
            <span className="text-xl sm:text-2xl font-black text-white mt-0.5 block">{stats.totalNotices}</span>
            <span className="text-[10px] text-amber-300 font-medium">Published across classes</span>
          </div>

          <div className="bg-white/5 rounded-xl p-3.5 border border-white/5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total SMS Sent</span>
            <span className="text-xl sm:text-2xl font-black text-amber-300 mt-0.5 block">{stats.totalSmsSent}</span>
            <span className="text-[10px] text-emerald-400 font-medium">Carrier delivered</span>
          </div>

          <div className="bg-white/5 rounded-xl p-3.5 border border-white/5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Students Notified</span>
            <span className="text-xl sm:text-2xl font-black text-white mt-0.5 block">{stats.studentSms}</span>
            <span className="text-[10px] text-slate-300 font-medium">Pupil mobile alerts</span>
          </div>

          <div className="bg-white/5 rounded-xl p-3.5 border border-white/5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Parents Notified</span>
            <span className="text-xl sm:text-2xl font-black text-white mt-0.5 block">{stats.parentSms}</span>
            <span className="text-[10px] text-emerald-400 font-medium">Guardian mobile alerts</span>
          </div>
        </div>
      </div>

      {/* Main Controls & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('bulletins')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'bulletins'
                ? 'bg-indigo-900 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>Class Notices ({notices.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sms-logs')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'sms-logs'
                ? 'bg-indigo-900 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>SMS Delivery Audit ({smsLogs.length})</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notice, pupil, parent..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200"
            />
          </div>

          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:border-indigo-500"
          >
            <option value="All">All Classes & Tiers</option>
            {CLASSES_LIST.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* VIEW 1: ACTIVE NOTICE BULLETINS */}
      {activeTab === 'bulletins' && (
        <div className="space-y-4">
          {filteredNotices.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
              <BellRing className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200">No Class Notices Found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                No notices match the selected class or search filter. Teachers and the Principal can post notices with automated SMS dispatch.
              </p>
              {canPublishNotice && (
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(true)}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-900 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-indigo-800 transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Post Notice Now</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredNotices.map((notice) => (
                <div 
                  key={notice.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden"
                >
                  {/* Top Priority Ribbon */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        Class: {notice.targetClass}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        notice.priority === 'Urgent Executive Order'
                          ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          : notice.priority === 'Official Directive'
                          ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      }`}>
                        {notice.priority}
                      </span>
                    </div>

                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {notice.date}
                    </span>
                  </div>

                  {/* Title & Body */}
                  <div className="space-y-2 mb-4">
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                      {notice.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                      {notice.content}
                    </p>
                  </div>

                  {/* SMS Broadcast Delivery Box (Prominently shows SMS sent to each student & parent) */}
                  <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-3 mb-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 text-xs font-black">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Instant SMS Dispatched</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900 px-2 py-0.5 rounded-full">
                        {notice.smsBroadcast?.status || 'Delivered'}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-900 dark:text-emerald-200 leading-normal">
                      Delivered to <strong>{notice.smsBroadcast?.studentCount || 24} students</strong> and <strong>{notice.smsBroadcast?.parentCount || 24} parents</strong> in {notice.targetClass} via {notice.smsBroadcast?.carrier || 'Orange SL / Africell SL GSM'}.
                    </p>
                  </div>

                  {/* Author Footer */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-900 dark:bg-slate-700 text-amber-300 flex items-center justify-center font-bold text-[10px]">
                        {notice.author.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">{notice.author}</span>
                        <span className="text-[10px] text-slate-500 capitalize">{notice.authorRole === 'admin' ? 'CEO/Principal' : 'Academic Teacher'}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedNoticeForAudit(notice)}
                      className="text-xs font-bold text-indigo-700 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                    >
                      <span>View SMS Audit</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: SMS DELIVERY AUDIT LOG */}
      {activeTab === 'sms-logs' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>GSM SMS Dispatch Transmission Log</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Detailed record of carrier text messages transmitted to each student and parent.
              </p>
            </div>
            <span className="text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-full">
              {filteredSmsLogs.length} Messages
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-100/70 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">Time & Date</th>
                  <th className="p-3">Recipient Type</th>
                  <th className="p-3">Recipient Name</th>
                  <th className="p-3">Student & Class</th>
                  <th className="p-3">Phone Number</th>
                  <th className="p-3">Carrier Gateway</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Message Text</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSmsLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      No SMS logs found for the selected query.
                    </td>
                  </tr>
                ) : (
                  filteredSmsLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          log.recipientType === 'Parent/Guardian'
                            ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300'
                            : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                        }`}>
                          {log.recipientType}
                        </span>
                      </td>
                      <td className="p-3 font-extrabold text-slate-900 dark:text-white">
                        {log.recipientName}
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">{log.studentName}</span>
                        <span className="text-[10px] text-slate-500 font-semibold">{log.currentClass}</span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                        {log.phoneNumber}
                      </td>
                      <td className="p-3 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                        {log.carrier}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <Check className="w-3.5 h-3.5 stroke-[3]" /> {log.status}
                        </span>
                      </td>
                      <td className="p-3 max-w-xs truncate text-slate-600 dark:text-slate-400" title={log.messageText}>
                        {log.messageText}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* COMPOSE NOTICE & BROADCAST SMS MODAL */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-400 text-slate-950 rounded-xl font-bold">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-white">Post Notice & Broadcast SMS</h3>
                  <p className="text-xs text-amber-300 font-medium">Automatic SMS to each student and parent in the selected class</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsComposeOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handlePublishNotice} className="p-6 space-y-4">
              {/* Target Class Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Target Class for Notice & SMS Dispatch</span>
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-extrabold">
                    {composeTargetStats.studentsCount} Students + {composeTargetStats.parentsCount} Parents = {composeTargetStats.totalSMS} SMS
                  </span>
                </label>
                <select
                  value={formTargetClass}
                  onChange={(e) => setFormTargetClass(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="All Classes">All Classes (Entire School-Wide Broadcast)</option>
                  {CLASSES_LIST.map((c) => (
                    <option key={c} value={c}>Class: {c}</option>
                  ))}
                </select>
              </div>

              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Notice Headline / Subject
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g., Mandatory BECE / WASSCE Science Practical & Revision Schedule"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Priority & Category Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Priority Level</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Official Directive">Official Directive</option>
                    <option value="Urgent Executive Order">Urgent Executive Order</option>
                    <option value="High Priority">High Priority</option>
                    <option value="Standard Academic Notice">Standard Academic Notice</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Academic">Academic & Continuous Assessment</option>
                    <option value="Exam Preparation">Exam Preparation (NPSE/BECE/WASSCE)</option>
                    <option value="Tuition">Tuition & Bursary Notice</option>
                    <option value="Discipline">Discipline & Conduct</option>
                    <option value="Attendance">Attendance & Punctuality</option>
                    <option value="Event">School Event & Assembly</option>
                    <option value="General">General Administrative</option>
                  </select>
                </div>
              </div>

              {/* Notice Content Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Notice Body & Instruction</label>
                <textarea
                  required
                  rows={4}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Detail the instructions for students and parents..."
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 leading-relaxed resize-none"
                />
              </div>

              {/* LIVE SMS PREVIEW BOX */}
              <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-slate-200">
                    <Smartphone className="w-4 h-4 text-amber-500" />
                    <span>Live Carrier SMS Preview</span>
                  </div>

                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => setPreviewRecipientType('student')}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                        previewRecipientType === 'student'
                          ? 'bg-amber-400 text-slate-950 shadow-xs'
                          : 'text-slate-500'
                      }`}
                    >
                      Pupil SMS
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewRecipientType('parent')}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                        previewRecipientType === 'parent'
                          ? 'bg-amber-400 text-slate-950 shadow-xs'
                          : 'text-slate-500'
                      }`}
                    >
                      Guardian SMS
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300 leading-relaxed">
                  {previewRecipientType === 'student' ? (
                    <span>
                      [{SCHOOL_INFO.shortName} NOTICE] To: Fatmata Kamara ({formTargetClass}). {formTitle || 'Notice Title'}: "{formContent ? formContent.slice(0, 95) + '...' : 'Notice details...'} - {user?.displayName || 'Principal'}, {SCHOOL_INFO.name}.
                    </span>
                  ) : (
                    <span>
                      [{SCHOOL_INFO.shortName} GUARDIAN SMS] Dear Mr. Bai Kamara (Parent of Fatmata Kamara, {formTargetClass}): {formTitle || 'Notice Title'} - "{formContent ? formContent.slice(0, 95) + '...' : 'Notice details...'} Issued by {user?.displayName || 'Principal'}, {SCHOOL_INFO.name}, Kambia.
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-amber-700 dark:text-amber-400">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    When published, the system automatically sends this SMS to <strong>every pupil</strong> and <strong>every parent</strong> in <strong>{formTargetClass}</strong>.
                  </span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  id="confirm-publish-notice-sms"
                >
                  <Send className="w-4 h-4" />
                  <span>Publish Notice & Send SMS ({composeTargetStats.totalSMS} SMS)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIVE DISPATCH PROGRESS OVERLAY */}
      {isDispatching && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-amber-500/30 text-center space-y-4">
            <div className="w-14 h-14 bg-amber-400 text-slate-950 rounded-2xl flex items-center justify-center mx-auto animate-bounce">
              <Smartphone className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black">Transmitting SMS to {formTargetClass}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Routing SMS to {composeTargetStats.studentsCount} Students & {composeTargetStats.parentsCount} Parents via Orange SL & Africell GSM Gateway...
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-200 dark:border-slate-700">
              <div 
                className="bg-gradient-to-r from-amber-400 to-amber-500 h-full transition-all duration-300 ease-out"
                style={{ width: `${dispatchProgress}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
              <span>Establishing GSM Handshake...</span>
              <span className="text-amber-500">{dispatchProgress}%</span>
            </div>
          </div>
        </div>
      )}

      {/* NOTICE AUDIT MODAL */}
      {selectedNoticeForAudit && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Notice SMS Delivery Audit</span>
                <h3 className="font-extrabold text-sm sm:text-base text-white">{selectedNoticeForAudit.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNoticeForAudit(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Carrier Dispatch Status: Fully Delivered</span>
                </div>
                <p className="text-xs text-emerald-900 dark:text-emerald-200">
                  Total of <strong>{selectedNoticeForAudit.smsBroadcast?.totalRecipients || 48} SMS alerts</strong> were delivered ({selectedNoticeForAudit.smsBroadcast?.studentCount || 24} students and {selectedNoticeForAudit.smsBroadcast?.parentCount || 24} parents) in {selectedNoticeForAudit.targetClass}.
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Notice Content</span>
                <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 leading-relaxed">
                  "{selectedNoticeForAudit.content}"
                </p>
              </div>

              <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Issued by: <strong>{selectedNoticeForAudit.author}</strong></span>
                <span className="text-slate-500">Date: <strong>{selectedNoticeForAudit.date}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Success Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-amber-500/40 flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
