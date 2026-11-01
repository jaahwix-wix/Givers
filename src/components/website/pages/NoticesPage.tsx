/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  BellRing, 
  Smartphone, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  CheckCircle2, 
  ShieldCheck, 
  ExternalLink,
  ChevronRight,
  Printer,
  X,
  Radio,
  FileText
} from 'lucide-react';
import { ClassNotice } from '../../../types';
import { SCHOOL_INFO } from '../../../initialData';
import schoolLogo from '../../../assets/logo.jpg';

interface NoticesPageProps {
  notices: ClassNotice[];
}

export default function NoticesPage({ notices }: NoticesPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [activeNoticeModal, setActiveNoticeModal] = useState<ClassNotice | null>(null);

  const filteredNotices = notices.filter(notice => {
    const matchesSearch = 
      notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notice.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notice.author.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClass = 
      selectedClassFilter === 'ALL' || 
      notice.targetClass === selectedClassFilter ||
      (selectedClassFilter === 'All Classes' && notice.targetClass === 'All Classes');

    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-8 pb-10" id="website-notices-page">
      {/* Banner */}
      <section className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-xl">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
            <Radio className="w-3.5 h-3.5 animate-pulse text-amber-400" />
            <span>Public Noticeboard & SMS Broadcast Center</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Official School Notices & SMS Dispatches
          </h1>
          <p className="text-base text-slate-300 leading-relaxed font-normal">
            Real-time public bulletin board for Givers World Mission Diplomats Academy & College in Kambia 1. All class notices are automatically mirrored via automated SMS to registered students and parent phone numbers.
          </p>
        </div>
      </section>

      {/* GSM Gateways Status Widget */}
      <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
              Sierra Leone GSM Gateway Hub
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 font-bold border border-orange-200">
              <Smartphone className="w-3.5 h-3.5" />
              Orange SL (076 / 078): Active
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-bold border border-purple-200">
              <Smartphone className="w-3.5 h-3.5" />
              Africell SL (077 / 088): Active
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold border border-blue-200">
              <Smartphone className="w-3.5 h-3.5" />
              QCell SL (030 / 033): Active
            </span>
          </div>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <section className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search notices, dates, authors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
          />
        </div>

        {/* Class Selector */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs cursor-pointer"
          >
            <option value="ALL">All Classes & Whole School</option>
            <option value="All Classes">All Classes Announcements</option>
            <option value="SSS 3">SSS 3 (WASSCE Candidates)</option>
            <option value="SSS 2">SSS 2</option>
            <option value="SSS 1">SSS 1</option>
            <option value="JSS 3">JSS 3 (BECE Candidates)</option>
            <option value="JSS 2">JSS 2</option>
            <option value="JSS 1">JSS 1</option>
            <option value="Class 6">Class 6 (NPSE Candidates)</option>
            <option value="Class 1">Class 1</option>
            <option value="Nursery 3">Nursery 3</option>
          </select>
        </div>
      </section>

      {/* Notice Cards List */}
      <section className="space-y-4">
        {filteredNotices.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
            <BellRing className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="text-base font-black text-slate-800">No notices found</h4>
            <p className="text-xs text-slate-500">
              Try modifying your search keywords or class filter above.
            </p>
          </div>
        ) : (
          filteredNotices.map((notice) => {
            const isUrgent = notice.priority.includes('Urgent') || notice.priority.includes('High');
            const hasSms = notice.smsBroadcast && notice.smsBroadcast.totalRecipients > 0;
            return (
              <div
                key={notice.id}
                onClick={() => setActiveNoticeModal(notice)}
                className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 shadow-xs hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                      isUrgent 
                        ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {notice.priority}
                    </span>

                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                      Target: {notice.targetClass}
                    </span>

                    {hasSms && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
                        <Smartphone className="w-3 h-3 text-amber-600" />
                        SMS Delivered ({notice.smsBroadcast.totalRecipients} recipients)
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(notice.date).toLocaleDateString(undefined, { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-emerald-700 transition-colors mb-2">
                  {notice.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2 mb-4 font-normal">
                  {notice.content}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <User className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Issued by: {notice.author}</span>
                  </div>

                  <span className="text-emerald-700 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Read Full Notice & SMS Audit</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Notice Detail Modal */}
      {activeNoticeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-emerald-500 p-0.5 bg-white">
                  <img 
                    src={schoolLogo} 
                    alt="Logo" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain" 
                  />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase">
                    Givers World Mission Diplomats Academy & College
                  </h4>
                  <p className="text-[10px] text-emerald-700 font-bold">
                    Official Notice Dispatch • Kambia 1, Sierra Leone
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveNoticeModal(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                    {activeNoticeModal.targetClass === 'All Classes' ? 'Whole School Announcement' : `Class: ${activeNoticeModal.targetClass}`}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {activeNoticeModal.date}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                  {activeNoticeModal.title}
                </h2>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                {activeNoticeModal.content}
              </div>

              {/* SMS Broadcast Audit Section */}
              {activeNoticeModal.smsBroadcast && (
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-amber-600" />
                      Automated SMS Broadcast Delivery Audit
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      {activeNoticeModal.smsBroadcast.status || 'Delivered'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-700 space-y-1">
                    <p>
                      <strong>Recipients Notified:</strong> {activeNoticeModal.smsBroadcast.totalRecipients} registered students & parents in {activeNoticeModal.targetClass}.
                    </p>
                    <p>
                      <strong>Carrier Gateway:</strong> {activeNoticeModal.smsBroadcast.carrier || 'Orange SL, Africell SL, QCell SL'}.
                    </p>
                    <p>
                      <strong>Audited By:</strong> {activeNoticeModal.author} (Digital Stamp Recorded)
                    </p>
                  </div>
                </div>
              )}

              {/* Sign-off & Stamp */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div>
                  <p className="font-bold text-slate-900">{activeNoticeModal.author}</p>
                  <p className="text-[11px] text-slate-400">Office of the Administration & Principal</p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-black text-[11px]">
                    Kambia 1 Campus
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Notice</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveNoticeModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
