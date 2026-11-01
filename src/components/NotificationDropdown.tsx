/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  CheckCheck, 
  CreditCard, 
  FileText, 
  Megaphone, 
  AlertTriangle, 
  X, 
  ChevronRight, 
  UploadCloud, 
  Plus, 
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import { NotificationAlert, SchoolAnnouncement } from '../types';
import { useAuth } from '../context/AuthContext';
import { SCHOOL_INFO } from '../initialData';

interface NotificationDropdownProps {
  alerts: NotificationAlert[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  onNavigate: (tab: string, arg?: any) => void;
  onAddAnnouncement: (ann: Omit<SchoolAnnouncement, 'id'>) => void;
}

export default function NotificationDropdown({
  alerts,
  unreadCount,
  markAsRead,
  markAllAsRead,
  onNavigate,
  onAddAnnouncement,
}: NotificationDropdownProps) {
  const { role, can } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'fee' | 'assignment' | 'announcement'>('all');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<NotificationAlert | null>(null);
  
  // Broadcast announcement modal state
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastPriority, setBroadcastPriority] = useState<'urgent' | 'normal'>('urgent');
  const [broadcastCategory, setBroadcastCategory] = useState<'fee' | 'academic' | 'transport' | 'administrative'>('administrative');

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Filtered alerts
  const filteredAlerts = alerts.filter(alert => {
    if (activeFilter === 'all') return true;
    return alert.type === activeFilter;
  });

  const handleAlertClick = (alert: NotificationAlert) => {
    markAsRead(alert.id);
    if (alert.type === 'announcement') {
      setSelectedAnnouncement(alert);
    } else if (alert.linkTab) {
      setIsOpen(false);
      onNavigate(alert.linkTab, alert.linkArgs);
    }
  };

  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    onAddAnnouncement({
      title: broadcastTitle.trim(),
      message: broadcastMessage.trim(),
      date: 'Just now',
      priority: broadcastPriority,
      author: `${SCHOOL_INFO.principalName} (${SCHOOL_INFO.principalTitle})`,
      category: broadcastCategory,
    });

    setBroadcastTitle('');
    setBroadcastMessage('');
    setIsBroadcastOpen(false);
  };

  const isPrincipalOrAdmin = role === 'admin' || can('canVerifyStaffAndStudents');

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        id="header-notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 sm:px-2.5 sm:py-2 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        title="Notifications & School Alerts"
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-600 dark:text-slate-300" />
        
        {unreadCount > 0 && (
          <span 
            id="notification-bell-badge"
            className="absolute -top-1.5 -right-1.5 min-w-[19px] h-[19px] px-1 bg-rose-600 text-white font-extrabold text-[10px] rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm animate-pulse"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Window */}
      {isOpen && (
        <div 
          id="header-notification-dropdown"
          className="absolute right-0 top-full mt-2.5 w-[360px] sm:w-[440px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 flex flex-col max-h-[560px]"
        >
          {/* Header */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg text-indigo-600 dark:text-indigo-400">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span>School Alerts & Activity</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 px-1.5 py-0.2 rounded-full font-extrabold">
                      {unreadCount} new
                    </span>
                  )}
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Tuition fees, assignment uploads & notices
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="px-2 py-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3 h-3" />
                  <span className="hidden sm:inline">Mark read</span>
                </button>
              )}
              {isPrincipalOrAdmin && (
                <button
                  type="button"
                  onClick={() => setIsBroadcastOpen(true)}
                  className="px-2 py-1 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                  title="Post School Announcement"
                >
                  <Plus className="w-3 h-3" />
                  <span>Broadcast</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-1.5 gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeFilter === 'all' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold' 
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <span>All Alerts</span>
              <span className="text-[9px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.2 rounded-full font-mono">
                {alerts.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('fee')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeFilter === 'fee' 
                  ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-2xs font-bold' 
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <CreditCard className="w-3 h-3" />
              <span>Pending Fees</span>
              <span className="text-[9px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded-full font-mono">
                {alerts.filter(a => a.type === 'fee').length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('assignment')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeFilter === 'assignment' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold' 
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <UploadCloud className="w-3 h-3" />
              <span>Assignments</span>
              <span className="text-[9px] bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 px-1.5 py-0.2 rounded-full font-mono">
                {alerts.filter(a => a.type === 'assignment').length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('announcement')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeFilter === 'announcement' 
                  ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-2xs font-bold' 
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Megaphone className="w-3 h-3" />
              <span>Announcements</span>
              <span className="text-[9px] bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 px-1.5 py-0.2 rounded-full font-mono">
                {alerts.filter(a => a.type === 'announcement').length}
              </span>
            </button>
          </div>

          {/* Alerts Scrollable List */}
          <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 flex-1 max-h-[380px]">
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map((alert) => {
                const isUrgent = alert.priority === 'urgent';
                const isHigh = alert.priority === 'high';

                return (
                  <div
                    key={alert.id}
                    onClick={() => handleAlertClick(alert)}
                    className={`p-3.5 transition-colors cursor-pointer group flex items-start gap-3 relative ${
                      !alert.read 
                        ? 'bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Unread indicator dot */}
                    {!alert.read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 absolute top-4 right-3 shrink-0" />
                    )}

                    {/* Alert Type Icon */}
                    <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      alert.type === 'fee'
                        ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300'
                        : alert.type === 'assignment'
                        ? 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300'
                        : isUrgent
                        ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 animate-pulse'
                        : 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300'
                    }`}>
                      {alert.type === 'fee' ? (
                        <CreditCard className="w-4 h-4" />
                      ) : alert.type === 'assignment' ? (
                        <UploadCloud className="w-4 h-4" />
                      ) : isUrgent ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <Megaphone className="w-4 h-4" />
                      )}
                    </div>

                    {/* Alert Content */}
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase font-mono ${
                          isUrgent
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            : isHigh
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {alert.priority}
                        </span>

                        <span className="text-[10px] text-slate-400 font-medium">
                          {alert.timestamp}
                        </span>
                      </div>

                      <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mt-1 leading-snug">
                        {alert.title}
                      </h4>

                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                        {alert.description}
                      </p>

                      <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                        <span>{alert.type === 'announcement' ? 'Read full notice' : 'Take action / View details'}</span>
                        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  All caught up!
                </p>
                <p className="text-[11px] text-slate-400">
                  No {activeFilter !== 'all' ? activeFilter : ''} notifications at this moment.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center text-[10px] text-slate-400 flex items-center justify-between px-4">
            <span className="font-semibold text-slate-500 dark:text-slate-400">
              Principal: {SCHOOL_INFO.principalName}
            </span>
            <span>{SCHOOL_INFO.name}</span>
          </div>
        </div>
      )}

      {/* ANNOUNCEMENT VIEWER MODAL */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-left animate-in fade-in zoom-in-95 duration-150">
            {/* National header banner */}
            <div className="flex h-1.5 w-full overflow-hidden">
              <div className="bg-emerald-500 w-1/3"></div>
              <div className="bg-white w-1/3"></div>
              <div className="bg-blue-500 w-1/3"></div>
            </div>

            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-100 dark:bg-rose-950/70 text-rose-600 rounded-xl">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 font-mono">
                    Official School Notice
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {SCHOOL_INFO.name}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                  {selectedAnnouncement.title}
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-mono shrink-0">
                  {selectedAnnouncement.priority.toUpperCase()}
                </span>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 whitespace-pre-wrap">
                {selectedAnnouncement.description}
              </div>

              <div className="bg-indigo-50/60 dark:bg-indigo-950/30 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Authority: <strong>{SCHOOL_INFO.principalName}</strong> ({SCHOOL_INFO.principalTitle})</span>
                </div>
                <span className="text-[10px] text-slate-400">{selectedAnnouncement.timestamp}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedAnnouncement(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Acknowledge & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BROADCAST URGENT ANNOUNCEMENT MODAL (Admin & Principal) */}
      {isBroadcastOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-left">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 rounded-xl">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Broadcast School Alert / Announcement
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Will appear in notification bell for all staff, students & administrators
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsBroadcastOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBroadcastSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Announcement Title
                </label>
                <input
                  type="text"
                  required
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g., Urgent: WASSCE Exam Hall Clearance / Fee Cutoff Notice"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-indigo-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Priority Level
                  </label>
                  <select
                    value={broadcastPriority}
                    onChange={(e) => setBroadcastPriority(e.target.value as 'urgent' | 'normal')}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-indigo-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  >
                    <option value="urgent">🔴 Urgent Priority</option>
                    <option value="normal">🔵 Normal Announcement</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Category
                  </label>
                  <select
                    value={broadcastCategory}
                    onChange={(e) => setBroadcastCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-indigo-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  >
                    <option value="administrative">Administrative Notice</option>
                    <option value="fee">Tuition & Bursary Notice</option>
                    <option value="academic">Academic & Exams</option>
                    <option value="transport">Bus & Logistics</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Announcement Body & Instructions
                </label>
                <textarea
                  required
                  rows={4}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Provide complete circular instructions, requirements, or deadlines for guardians, staff, and students..."
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-indigo-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 leading-relaxed"
                />
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Notice will be published under the authority of <strong>{SCHOOL_INFO.principalName}</strong> ({SCHOOL_INFO.principalTitle}).</span>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Publish Announcement
                </button>
                <button
                  type="button"
                  onClick={() => setIsBroadcastOpen(false)}
                  className="py-2 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
