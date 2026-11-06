/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  X, 
  User, 
  CreditCard, 
  FileText, 
  Award, 
  ChevronRight, 
  Sparkles, 
  ArrowRight,
  Shield,
  Key,
  Lock,
  Clock,
  IdCard,
  Copy,
  Check,
  Globe,
  Cloud,
  Database
} from 'lucide-react';
import { Student, StudentFeeLedger } from '../types';
import { SCHOOL_INFO } from '../initialData';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import NotificationDropdown from './NotificationDropdown';
import SupabaseConfigModal from './SupabaseConfigModal';

interface GlobalHeaderProps {
  students: Student[];
  fees: StudentFeeLedger[];
  activeTab: string;
  onNavigate: (tab: string, arg?: any) => void;
  onOpenPrivileges: () => void;
  onNavigateToWebsite?: () => void;
}

export default function GlobalHeader({ students, fees, activeTab, onNavigate, onOpenPrivileges, onNavigateToWebsite }: GlobalHeaderProps) {
  const { user, role, privileges, isSupabaseOnline, lockSession, secondsRemaining, resetInactivityTimer } = useAuth();
  const { alerts, unreadCount, markAsRead, markAllAsRead, addAnnouncement } = useNotifications({ students, fees });
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Global Keyboard Shortcut listener (Press '/' or 'Cmd+K' to search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && 
          document.activeElement?.tagName !== 'INPUT' && 
          document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click Outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter students based on name or admission ID
  const searchResults = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    return students.filter(student => 
      (student.name || '').toLowerCase().includes(query) ||
      (student.admissionNumber || '').toLowerCase().includes(query) ||
      (student.currentClass || '').toLowerCase().includes(query)
    ).slice(0, 8); // Top 8 results
  }, [students, searchQuery]);

  const handleSelectStudent = (student: Student, targetTab: string = 'students') => {
    setIsOpen(false);
    setSearchQuery('');
    onNavigate(targetTab, { studentId: student.id, search: student.name });
  };

  // Get active term fee status helper
  const getStudentFeeStatus = (studentId: string) => {
    const ledger = fees.find(f => f.studentId === studentId);
    if (!ledger || !ledger.terms || !ledger.terms[3]) return null;
    return ledger.terms[3];
  };

  return (
    <header 
      className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-4 md:px-8 py-3 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-xs transition-colors duration-200 print:hidden" 
      id="global-layout-header"
    >
      {/* Search Input Container */}
      <div className="relative flex-1 max-w-2xl" ref={dropdownRef}>
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search student by name or ID number (e.g., Fatmata, GWM-2024-001)..."
            className="w-full pl-10 pr-20 py-2 bg-slate-100/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl text-xs sm:text-sm font-medium border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all shadow-xs"
            id="global-student-search-input"
          />

          <div className="absolute right-3 flex items-center gap-1.5 pointer-events-none">
            {searchQuery ? (
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery('');
                  setIsOpen(false);
                }}
                className="pointer-events-auto p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-200/60 dark:bg-slate-700/60 rounded border border-slate-300/60 dark:border-slate-600">
                /
              </kbd>
            )}
          </div>
        </div>

        {/* Global Search Results Dropdown Overlay */}
        {isOpen && searchQuery.trim().length > 0 && (
          <div 
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 max-h-[480px] flex flex-col"
            id="global-search-results-dropdown"
          >
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold">
                {searchResults.length > 0 
                  ? `Found ${searchResults.length} student${searchResults.length === 1 ? '' : 's'}`
                  : 'No student records found'}
              </span>
              <span className="text-[10px] text-slate-400">Press Esc to close</span>
            </div>

            <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 flex-1">
              {searchResults.length > 0 ? (
                searchResults.map((student) => {
                  const feeInfo = getStudentFeeStatus(student.id);
                  return (
                    <div
                      key={student.id}
                      onClick={() => handleSelectStudent(student, 'students')}
                      className="p-3.5 hover:bg-indigo-50/50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        {student.profileImage ? (
                          <img
                            src={student.profileImage}
                            alt={student.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-sm flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800">
                            {student.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                              {student.name}
                            </h4>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono shrink-0">
                              <span>{student.admissionNumber}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(student.admissionNumber);
                                  setCopiedId(student.id);
                                  setTimeout(() => setCopiedId(null), 2000);
                                }}
                                className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-0.5 rounded cursor-pointer"
                                title="Copy Student ID"
                              >
                                {copiedId === student.id ? (
                                  <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                  <Copy className="w-2.5 h-2.5" />
                                )}
                              </button>
                            </span>
                          </div>
                          
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Class: <span className="font-medium text-slate-700 dark:text-slate-300">{student.currentClass} {student.stream ? `(${student.stream})` : ''}</span> • Parent: {student.parentName}
                          </p>
                        </div>
                      </div>

                      {/* Quick Action Navigation Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                        {feeInfo && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            feeInfo.status === 'Paid' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900' 
                              : feeInfo.status === 'Partial'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900'
                              : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-900'
                          }`}>
                            {feeInfo.status}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectStudent(student, 'students');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white dark:bg-indigo-950/80 dark:hover:bg-indigo-600 dark:text-indigo-300 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                          title="View Student File"
                        >
                          <User className="w-3 h-3" />
                          <span>File</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectStudent(student, 'fees');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-600 text-amber-700 hover:text-white dark:bg-amber-950/80 dark:hover:bg-amber-600 dark:text-amber-300 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                          title="View Tuition Ledger"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>Fees</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(false);
                            setSearchQuery('');
                            onNavigate('id-cards', { type: 'student', id: student.id });
                          }}
                          className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white dark:bg-purple-950/80 dark:hover:bg-purple-600 dark:text-purple-300 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                          title="Generate & View ID Card"
                        >
                          <IdCard className="w-3 h-3" />
                          <span>ID Card</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectStudent(student, 'report-card');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white dark:bg-blue-950/80 dark:hover:bg-blue-600 dark:text-blue-300 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                          title="View Report Card"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Report</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <User className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    No matching student found for "{searchQuery}"
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Try searching by full name, first name, or admission number (e.g., GWM-2024-001)
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Header Right Status Bar */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          type="button"
          onClick={() => setIsSupabaseModalOpen(true)}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold transition-all cursor-pointer shadow-2xs group"
          title="Click to view Supabase database connection, credentials, and SQL schema setup"
        >
          <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Supabase Synced</span>
        </button>

        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Academic Year: 2025/2026</span>
        </div>

        {/* 1-Minute Inactivity Session Monitor & Manual Lock */}
        <div 
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            secondsRemaining <= 15
              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800/80 animate-pulse'
              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
          }`}
          title="Auto-locks after 1 minute of inactivity. Any interaction resets the timer."
        >
          <Clock className={`w-3.5 h-3.5 ${secondsRemaining <= 15 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-500'}`} />
          <span className="hidden sm:inline text-[11px]">Auto-Lock:</span>
          <span className="font-mono font-bold text-xs">{secondsRemaining}s</span>
          <button
            type="button"
            onClick={lockSession}
            className="ml-1 p-0.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Lock session now"
          >
            <Lock className="w-3 h-3" />
          </button>
        </div>

        {/* Notification Bell with Dropdown */}
        <NotificationDropdown 
          alerts={alerts}
          unreadCount={unreadCount}
          markAsRead={markAsRead}
          markAllAsRead={markAllAsRead}
          onNavigate={onNavigate}
          onAddAnnouncement={addAnnouncement}
        />

        {/* Public Website Switcher */}
        {onNavigateToWebsite && (
          <button
            type="button"
            onClick={onNavigateToWebsite}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs shadow-xs transition-colors cursor-pointer"
            title="View the public school website & noticeboard"
            id="global-header-view-website-btn"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Public Website</span>
          </button>
        )}

        {/* Role & Privileges Trigger */}
        <button
          type="button"
          onClick={onOpenPrivileges}
          className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
          title="Open Authentication & Privileges Management"
        >
          <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs overflow-hidden shrink-0">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
            ) : (
              <span>{user?.displayName?.charAt(0).toUpperCase() || 'A'}</span>
            )}
          </div>
          
          <div className="text-left hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 dark:text-white leading-none text-xs">
                {user?.displayName ? user.displayName.split(' ')[0] : 'Admin'}
              </span>
              <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md leading-none ${
                role === 'admin' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300' :
                role === 'teacher' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300' :
                role === 'bursar' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300' :
                role === 'transport' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300' :
                'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300'
              }`}>
                {role.toUpperCase()}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block leading-tight mt-0.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
              Manage Privileges
            </span>
          </div>

          <Shield className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors shrink-0" />
        </button>
      </div>

      {/* Floating Inactivity Warning when <= 15 seconds remain before 1-minute auto-lock */}
      {secondsRemaining <= 15 && secondsRemaining > 0 && (
        <div className="fixed bottom-5 right-5 z-[9990] bg-slate-900 border-2 border-rose-500 shadow-2xl rounded-2xl p-4 max-w-sm flex items-start gap-3.5 text-white animate-bounce">
          <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
            <Clock className="w-5 h-5 animate-spin" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black uppercase tracking-wider text-rose-400">
              Inactivity Timeout Warning
            </h4>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              System is inactive. You will be asked to <strong className="text-white">log in again in {secondsRemaining}s</strong>.
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={resetInactivityTimer}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                I'm Still Here (Stay Logged In)
              </button>
              <button
                type="button"
                onClick={lockSession}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Lock Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Supabase Database Settings & SQL Setup Modal */}
      <SupabaseConfigModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        students={students}
        fees={fees}
      />
    </header>
  );
}
