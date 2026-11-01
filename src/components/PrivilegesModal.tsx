/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Shield, 
  User, 
  Check, 
  X, 
  Lock, 
  Unlock, 
  LogIn, 
  LogOut, 
  Users, 
  Key, 
  GraduationCap, 
  BookOpen, 
  CreditCard, 
  Bus, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { ROLE_PRIVILEGES_MAP } from '../firebase';
import { motion } from 'motion/react';

interface PrivilegesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivilegesModal({ isOpen, onClose }: PrivilegesModalProps) {
  const { 
    user, 
    role, 
    privileges, 
    signInWithGoogle, 
    signOutUser, 
    switchRole, 
    updateUserRole, 
    userList, 
    can,
    isFirebaseOnline
  } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'users'>('matrix');

  if (!isOpen) return null;

  const roles: { role: UserRole; title: string; desc: string; icon: any; color: string; badge: string }[] = [
    {
      role: 'admin',
      title: 'Super Admin / Principal',
      desc: 'Unrestricted master access across all administrative, academic, financial, and fleet modules.',
      icon: Shield,
      color: 'indigo',
      badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
    },
    {
      role: 'teacher',
      title: 'Senior Teacher / Academic Staff',
      desc: 'Enters continuous assessment marks, manages daily attendance, conduct, and prints terminal reports.',
      icon: GraduationCap,
      color: 'emerald',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
    },
    {
      role: 'bursar',
      title: 'School Bursar / Financial Officer',
      desc: 'Records tuition fees, issues official receipts, tracks school expenditures, and monitors defaulters.',
      icon: CreditCard,
      color: 'amber',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
    },
    {
      role: 'transport',
      title: 'Transportation & Logistics Officer',
      desc: 'Fleet coordination, bus schedule management, driver assignments, and student transit manifests.',
      icon: Bus,
      color: 'blue',
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 border-blue-200 dark:border-blue-800'
    },
    {
      role: 'student_parent',
      title: 'Student & Guardian Portal',
      desc: 'Read-only access to termly academic grades, report cards, fee payment history, and bus routes.',
      icon: BookOpen,
      color: 'purple',
      badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300 border-purple-200 dark:border-purple-800'
    }
  ];

  const permissionKeys: { key: keyof typeof privileges; label: string; module: string }[] = [
    { key: 'canViewDashboard', label: 'Executive Dashboard & KPI Metrics', module: 'Dashboard' },
    { key: 'canViewStudents', label: 'Student Directory & ID Card Generation', module: 'Students' },
    { key: 'canManageStudents', label: 'Register / Edit / Delete Student Files', module: 'Students' },
    { key: 'canTakeAttendance', label: 'Daily Attendance & Absence Logging', module: 'Attendance' },
    { key: 'canManageDiscipline', label: 'Incident & Disciplinary Action Logging', module: 'Discipline' },
    { key: 'canViewAcademics', label: 'Academic Portal & Grade Inspection', module: 'Academics' },
    { key: 'canManageAcademics', label: 'Enter Continuous Assessment & Exam Marks', module: 'Academics' },
    { key: 'canGenerateReportCards', label: 'Generate & Print Terminal Report Cards', module: 'Reports' },
    { key: 'canViewFinances', label: 'Financial Summary & Tuition Status Inspection', module: 'Financials' },
    { key: 'canManageFinances', label: 'Record Fee Payments & School Expenses', module: 'Financials' },
    { key: 'canManageStaff', label: 'Staff Roster, Subject Allocation & Salaries', module: 'Staff' },
    { key: 'canManageBus', label: 'School Bus Fleet, Routes & Commuters', module: 'Transport' },
    { key: 'canManageLibrary', label: 'Library Catalog, Checkouts & Returns', module: 'Library' },
    { key: 'canBackupData', label: 'System Backup, JSON Export & Core Settings', module: 'System' },
    { key: 'canManageUserRoles', label: 'User Role Assignment & Privileges Control', module: 'Security' },
    { key: 'canVerifyStaffAndStudents', label: 'Official Verification of Staff & Students (Principal: Evangelist Saint Turay)', module: 'Governance' },
  ];

  return (
    <div 
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 12 }}
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
      >
        {/* Header */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white p-5 sm:px-6 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">Authentication & Privilege Management</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${isFirebaseOnline ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}>
                  {isFirebaseOnline ? 'Firebase Connected' : 'Local Mode'}
                </span>
              </div>
              <p className="text-slate-400 text-xs">Role-Based Access Control (RBAC) & User Security Matrix</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current User & Active Role Banner */}
        <div className="bg-slate-50 dark:bg-slate-850 p-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center text-lg shadow-sm border-2 border-white dark:border-slate-800 overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
              ) : (
                <span>{user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                  {user?.displayName || 'Active Account'}
                </span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                  role === 'admin' ? 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/60 dark:text-indigo-300' :
                  role === 'teacher' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/60 dark:text-emerald-300' :
                  role === 'bursar' ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/60 dark:text-amber-300' :
                  role === 'transport' ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/60 dark:text-blue-300' :
                  'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/60 dark:text-purple-300'
                }`}>
                  {privileges.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {user?.email || 'Authenticated User'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={signInWithGoogle}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all flex items-center gap-2 shadow-2xs cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{user?.email && !user.isCustomRole ? 'Switch Google Account' : 'Sign in with Google'}</span>
            </button>

            <button
              type="button"
              onClick={signOutUser}
              className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Reset session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Reset / Log Out</span>
            </button>
          </div>
        </div>

        {/* Quick Role Switcher (Crucial for testing all 5 roles) */}
        <div className="p-4 sm:px-6 bg-indigo-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Instant Role Switcher (Interactive Testing)
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Click any role to simulate that user's view & privileges
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {roles.map(r => {
              const Icon = r.icon;
              const isSelected = role === r.role;
              return (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => switchRole(r.role)}
                  className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                    isSelected 
                      ? 'bg-white dark:bg-slate-800 border-indigo-600 dark:border-indigo-500 shadow-md ring-2 ring-indigo-500/20' 
                      : 'bg-white/80 dark:bg-slate-850/80 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400"></span>
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-slate-900 dark:text-white leading-tight">
                      {r.title.split('/')[0]}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 line-clamp-1">
                      {r.role}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab switcher: Privileges Matrix vs Users Roster */}
        <div className="px-6 pt-3 flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('matrix')}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'matrix' 
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            System Privileges Matrix
          </button>
          
          <button
            type="button"
            onClick={() => setActiveSubTab('users')}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'users' 
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Staff & User Accounts ({userList.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeSubTab === 'matrix' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Active Role Permissions</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{privileges.description}</p>
                </div>
                <div className="text-xs font-semibold px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Current: <strong className="text-indigo-600 dark:text-indigo-400">{role.toUpperCase()}</strong>
                </div>
              </div>

              {/* Matrix Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                      <th className="p-3">Module / Capability</th>
                      <th className="p-3 text-center">Super Admin</th>
                      <th className="p-3 text-center">Teacher</th>
                      <th className="p-3 text-center">Bursar</th>
                      <th className="p-3 text-center">Transport</th>
                      <th className="p-3 text-center">Student/Parent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {permissionKeys.map((p, idx) => {
                      return (
                        <tr 
                          key={p.key} 
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                            idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/40 dark:bg-slate-850/40'
                          }`}
                        >
                          <td className="p-3">
                            <span className="font-semibold text-slate-900 dark:text-white block">{p.label}</span>
                            <span className="text-[10px] text-slate-400 uppercase font-medium">{p.module}</span>
                          </td>
                          {(['admin', 'teacher', 'bursar', 'transport', 'student_parent'] as UserRole[]).map(r => {
                            const isAllowed = Boolean(ROLE_PRIVILEGES_MAP[r][p.key]);
                            const isCurrent = role === r;
                            return (
                              <td 
                                key={r} 
                                className={`p-3 text-center ${isCurrent ? 'bg-indigo-50/50 dark:bg-indigo-950/20 font-bold' : ''}`}
                              >
                                {isAllowed ? (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 mx-auto">
                                    <Check className="w-3.5 h-3.5" />
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 mx-auto">
                                    <X className="w-3.5 h-3.5" />
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* User Accounts Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Registered Users & Role Allocations</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {can('canManageUserRoles') 
                      ? 'As Super Administrator, you can promote or alter role privileges for any user account.' 
                      : 'You need Super Administrator privileges to reassign user roles.'}
                  </p>
                </div>
                {!can('canManageUserRoles') && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-900/50">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Role Editing Locked</span>
                  </div>
                )}
              </div>

              <div className="space-y-2.5">
                {userList.map(u => {
                  const isCurrentUser = user?.uid === u.uid;
                  return (
                    <div 
                      key={u.uid}
                      className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                          {u.displayName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                              {u.displayName || u.email}
                            </span>
                            {isCurrentUser && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400">{u.email}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <label className="text-xs text-slate-500">Role:</label>
                        <select
                          disabled={!can('canManageUserRoles')}
                          value={u.role}
                          onChange={(e) => updateUserRole(u.uid, e.target.value as UserRole)}
                          className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <option value="admin">Super Admin / Principal</option>
                          <option value="teacher">Senior Teacher</option>
                          <option value="bursar">School Bursar</option>
                          <option value="transport">Fleet Officer</option>
                          <option value="student_parent">Student / Parent</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:px-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-500" />
            <span>Givers World Mission School RBAC Engine</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
