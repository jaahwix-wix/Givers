/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldAlert, Lock, ArrowLeft, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface AccessRestrictedProps {
  moduleName: string;
  requiredPrivilege: string;
  onNavigateHome: () => void;
  onOpenPrivileges: () => void;
}

export default function AccessRestricted({
  moduleName,
  requiredPrivilege,
  onNavigateHome,
  onOpenPrivileges,
}: AccessRestrictedProps) {
  const { role, privileges, switchRole } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-4 shadow-xs">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
        Access Restricted: {moduleName}
      </h3>
      
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
        Your current role (<strong className="text-slate-800 dark:text-slate-200 font-semibold">{privileges.label}</strong>) does not have authorization for <em>"{requiredPrivilege}"</em>.
      </p>

      <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full mb-6 text-left">
        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Lock className="w-3.5 h-3.5 text-amber-500" />
          <span>Security Protocol Notice</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Givers World Mission School enforces strict role segregation. Academic records, student registries, and tuition finances are quarantined to certified staff members.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onNavigateHome}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Allowed Modules</span>
        </button>

        <button
          type="button"
          onClick={onOpenPrivileges}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <Key className="w-4 h-4" />
          <span>Switch Role / Test Privileges</span>
        </button>

        {role !== 'admin' && (
          <button
            type="button"
            onClick={() => switchRole('admin')}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <span>Log in as Super Admin</span>
          </button>
        )}
      </div>
    </div>
  );
}
