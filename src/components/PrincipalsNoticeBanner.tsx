/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Pin, 
  Edit3, 
  CheckCircle2, 
  ShieldCheck, 
  X, 
  Save, 
  Sparkles,
  Calendar,
  UserCheck,
  Smartphone,
  Send
} from 'lucide-react';
import { PrincipalsNotice, StudentClass, ClassNotice } from '../types';
import { SCHOOL_INFO } from '../initialData';
import { CLASSES_LIST } from '../constants';
import { useAuth } from '../context/AuthContext';
import { broadcastNoticeSMS } from '../utils/smsNoticeUtils';

export const DEFAULT_PRINCIPALS_NOTICE: PrincipalsNotice & { targetClass?: string; smsSentCount?: number } = {
  id: 'pn-est-001',
  title: 'Term 3 Executive Directive: WASSCE Candidate Clearance, CA Registers & Terminal Tuition',
  content: 'All academic staff are instructed to finalize and submit terminal Continuous Assessment (CA) registers to the Vice Principal. Mandatory weekend revision clinics for NPSE, BECE, and WASSCE candidates are active every Saturday at 8:30 AM. Parents and guardians must settle outstanding tuition dues with the Bursary office before official terminal examination seat cards are issued.',
  author: 'Evangelist Saint Turay',
  role: 'CEO & Principal',
  date: 'September 12, 2026',
  isPinned: true,
  priority: 'Official Directive',
  category: 'Executive Administration',
  lastUpdated: new Date().toISOString().split('T')[0],
  targetClass: 'All Classes',
  smsSentCount: 96
};

interface PrincipalsNoticeBannerProps {
  variant?: 'dashboard' | 'portal' | 'staff';
}

export default function PrincipalsNoticeBanner({ variant = 'dashboard' }: PrincipalsNoticeBannerProps) {
  const { role, can } = useAuth();
  const canEditNotice = can('canVerifyStaffAndStudents') || role === 'admin';

  const [notice, setNotice] = useState<PrincipalsNotice & { targetClass?: string; smsSentCount?: number }>(() => {
    const cached = localStorage.getItem('sma_principal_pinned_notice');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error('Failed to parse principal notice', e);
      }
    }
    return DEFAULT_PRINCIPALS_NOTICE;
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formTitle, setFormTitle] = useState(notice.title);
  const [formContent, setFormContent] = useState(notice.content);
  const [formPriority, setFormPriority] = useState<PrincipalsNotice['priority']>(notice.priority);
  const [formCategory, setFormCategory] = useState(notice.category);
  const [formTargetClass, setFormTargetClass] = useState<string>(notice.targetClass || 'All Classes');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Synchronize across components
  useEffect(() => {
    const handleSync = () => {
      const cached = localStorage.getItem('sma_principal_pinned_notice');
      if (cached) {
        try {
          setNotice(JSON.parse(cached));
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('sma_principal_notice_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('sma_principal_notice_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const handleOpenEdit = () => {
    setFormTitle(notice.title);
    setFormContent(notice.content);
    setFormPriority(notice.priority);
    setFormCategory(notice.category);
    setFormTargetClass(notice.targetClass || 'All Classes');
    setIsEditing(true);
  };

  const handleSaveNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) return;

    // Retrieve active students from storage
    let currentStudents: any[] = [];
    try {
      const s = localStorage.getItem('sma_students');
      if (s) currentStudents = JSON.parse(s);
    } catch (err) {
      console.warn(err);
    }

    // Trigger automated SMS broadcast to all students and parents in target class
    const noticeToBroadcast: ClassNotice = {
      id: `pn-broadcast-${Date.now()}`,
      title: formTitle.trim(),
      content: formContent.trim(),
      author: SCHOOL_INFO.principalName,
      authorRole: 'admin',
      authorEmail: 'principal.givers@school.edu.sl',
      targetClass: formTargetClass as any,
      priority: formPriority as any,
      category: 'General',
      isPinned: true,
      createdAt: new Date().toISOString(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      smsBroadcast: {
        totalRecipients: 0,
        studentCount: 0,
        parentCount: 0,
        deliveredCount: 0,
        status: 'Broadcasting',
        sentAt: 'Sending...',
        carrier: 'Sierra Leone GSM Gateway'
      }
    };

    const smsResult = broadcastNoticeSMS(noticeToBroadcast, currentStudents);

    const updated = {
      ...notice,
      title: formTitle.trim(),
      content: formContent.trim(),
      priority: formPriority,
      category: formCategory.trim() || 'Executive Directive',
      targetClass: formTargetClass,
      smsSentCount: smsResult.totalSent,
      author: SCHOOL_INFO.principalName,
      role: 'CEO & Principal',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      isPinned: true,
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    setNotice(updated);
    localStorage.setItem('sma_principal_pinned_notice', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('sma_principal_notice_updated'));
    window.dispatchEvent(new Event('storage'));
    setIsEditing(false);

    setToastMessage(`Directive updated & ${smsResult.totalSent} SMS broadcasted to students & parents in ${formTargetClass}!`);
    setTimeout(() => setToastMessage(null), 4500);
  };


  return (
    <div className="relative" id="principals-notice-banner-container">
      {/* Principal Notice Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-2 border-amber-500/40 text-white p-5 sm:p-6 shadow-md">
        {/* Top Gold Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500"></div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 shadow-inner shrink-0">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-amber-400 text-slate-950 shadow-xs">
                  <Pin className="w-3 h-3" /> Pinned Notice
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300/90 border border-amber-400/20 px-2 py-0.5 rounded-full bg-amber-500/10">
                  {notice.priority}
                </span>
                <span className="text-[10px] text-slate-300 font-medium">
                  {notice.category}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-amber-200 tracking-wide mt-1 uppercase flex items-center gap-2">
                <span>From the Desk of the CEO/Principal: {notice.author}</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Official Broadcast</span>
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1 justify-end">
                <Calendar className="w-3 h-3 text-amber-400" /> {notice.date}
              </span>
            </div>

            {canEditNotice && (
              <button
                type="button"
                onClick={handleOpenEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                title="Edit and broadcast a pinned announcement as Principal"
                id="edit-principal-notice-btn"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Update Notice</span>
              </button>
            )}
          </div>
        </div>

        {/* Notice Body */}
        <div className="mt-4 space-y-2">
          <h3 className="text-base sm:text-lg font-black text-white leading-tight">
            {notice.title}
          </h3>
          <p className="text-slate-200 text-xs sm:text-sm leading-relaxed font-normal bg-white/5 p-3.5 rounded-xl border border-white/5">
            "{notice.content}"
          </p>
        </div>

        {/* Notice Footer with Verification Stamp & SMS Broadcast Badge */}
        <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center font-black text-[10px]">
              EST
            </div>
            <span className="font-semibold text-white">
              {SCHOOL_INFO.principalName} • {SCHOOL_INFO.principalTitle}, {SCHOOL_INFO.name}
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>SMS Dispatched to Students & Parents ({notice.targetClass || 'All Classes'})</span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-amber-300/80">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Visible to All Portals</span>
            </div>
          </div>
        </div>
      </div>

      {/* EDIT MODAL (ADMIN ONLY) */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white text-slate-800 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-400 text-slate-950 rounded-xl font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-white">Principal's Pinned Announcement</h3>
                  <p className="text-xs text-amber-300">Evangelist Saint Turay (CEO/Principal Executive Dispatch with SMS)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNotice} className="p-5 space-y-4">
              {/* Target Class Selection for SMS */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Target Class for Notice & Automated SMS</span>
                  <span className="text-[11px] text-amber-700 font-extrabold">Sends SMS to every pupil & parent</span>
                </label>
                <select
                  value={formTargetClass}
                  onChange={(e) => setFormTargetClass(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                >
                  <option value="All Classes">All Classes (Entire School-Wide Broadcast)</option>
                  {CLASSES_LIST.map((c) => (
                    <option key={c} value={c}>Class: {c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Notice Headline / Title</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Official Term 3 Instructions: CA Registers & Mock Dates..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Directive Level</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as PrincipalsNotice['priority'])}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Official Directive">Official Directive</option>
                    <option value="Urgent Executive Order">Urgent Executive Order</option>
                    <option value="High Priority">High Priority</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Category Tag</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="e.g. Academic, Exams, Finance..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Announcement Directive Message</label>
                <textarea
                  required
                  rows={5}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Write the executive announcement to all staff, teachers, students and parents..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-500 leading-relaxed resize-none"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 flex items-start gap-2">
                <Smartphone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Automated SMS Broadcast:</strong> Upon saving, the system will automatically send individual SMS alerts to all students and parents in <strong>{formTargetClass}</strong> via Orange SL & Africell GSM gateway.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish & Broadcast SMS</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Success Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-800 flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
