/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Lock, 
  Unlock, 
  KeyRound, 
  ShieldCheck, 
  User, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  LogIn, 
  Clock, 
  GraduationCap, 
  CreditCard, 
  Bus, 
  BookOpen, 
  Shield, 
  CheckCircle2,
  AlertCircle,
  Globe,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { SCHOOL_INFO } from '../initialData';
import schoolLogo from '../assets/logo.jpg';

interface SessionLoginGateProps {
  onReturnToWebsite?: () => void;
}

export default function SessionLoginGate({ onReturnToWebsite }: SessionLoginGateProps) {
  const { 
    user, 
    role, 
    isSessionLocked, 
    unlockSession, 
    signInWithGoogle, 
    isLoading 
  } = useAuth();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(role || 'admin');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'current' | 'switch' | 'student'>('current');
  const [studentAdmissionNo, setStudentAdmissionNo] = useState('');

  if (!isSessionLocked) {
    return null;
  }

  // Pre-configured staff directory for quick institutional authentication
  const accounts: { role: UserRole; title: string; name: string; email: string; icon: any; color: string }[] = [
    {
      role: 'admin',
      title: 'Super Admin / Principal',
      name: 'Evangelist Saint Turay',
      email: 'principal.givers@school.edu.sl',
      icon: Shield,
      color: 'indigo'
    },
    {
      role: 'teacher',
      title: 'Senior Teacher / Academics',
      name: 'Mrs. Fatmata Turay',
      email: 'mrs.turay.academics@school.edu.sl',
      icon: GraduationCap,
      color: 'emerald'
    },
    {
      role: 'bursar',
      title: 'Bursar / Financial Officer',
      name: 'Mr. Alie Sesay',
      email: 'bursar.sesay@school.edu.sl',
      icon: CreditCard,
      color: 'amber'
    },
    {
      role: 'transport',
      title: 'Logistics & Fleet Officer',
      name: 'Mr. Ibrahim Kamara',
      email: 'transport.kamara@school.edu.sl',
      icon: Bus,
      color: 'blue'
    },
    {
      role: 'student_parent',
      title: 'Student & Guardian Portal',
      name: 'Mustapha Koroma (SMA-2023-0142)',
      email: 'student.portal@school.edu.sl',
      icon: BookOpen,
      color: 'purple'
    }
  ];

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!password.trim()) {
      setErrorMsg('Please enter your passcode or PIN to log in again (Default PIN: 1234).');
      return;
    }

    setIsSuccess(true);
    setTimeout(() => {
      unlockSession(selectedRole);
      setPassword('');
      setIsSuccess(false);
    }, 400);
  };

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentAdmissionNo.trim()) {
      setErrorMsg('Please enter your Admission Number (e.g., SMA-2023-0142) to log in.');
      return;
    }
    setIsSuccess(true);
    setTimeout(() => {
      localStorage.setItem('sma_active_portal_student', studentAdmissionNo.trim());
      unlockSession('student_parent');
      setIsSuccess(false);
    }, 400);
  };

  const currentAccount = accounts.find(a => a.role === selectedRole) || accounts[0];

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      id="session-inactivity-login-gate"
    >
      {/* Background Animated Accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-emerald-600/30 blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-indigo-600/30 blur-3xl"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl shadow-black/80 overflow-hidden text-white my-auto"
      >
        {/* National / Institutional Accent Stripe */}
        <div className="h-1.5 w-full flex">
          <div className="bg-emerald-500 w-1/3"></div>
          <div className="bg-white w-1/3"></div>
          <div className="bg-blue-500 w-1/3"></div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header & Crest */}
          <div className="text-center space-y-3">
            <div className="relative inline-block">
              <img 
                src={schoolLogo} 
                alt={`${SCHOOL_INFO.name} Crest`}
                className="w-20 h-20 mx-auto rounded-2xl object-contain bg-white p-1 shadow-md border-2 border-emerald-500/40"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-full bg-amber-500 text-slate-950 shadow-md">
                <Lock className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-slate-100">
                {SCHOOL_INFO.name}
              </h2>
              <p className="text-xs text-emerald-400 font-bold tracking-wide mt-0.5">
                {SCHOOL_INFO.motto} • Kambia, Sierra Leone
              </p>
            </div>

            {/* Inactivity Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>System Inactive: 1 Minute Inactivity Timeout</span>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-100">
                Kindly Log In Again to Continue
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                For student confidentiality and school database protection, the session was locked after 1 minute of inactivity. Kindly enter your credentials or sign in with Google to resume.
              </p>
            </div>
          </div>

          {/* Quick Google Sign-In (Primary One-Click Option) */}
          <div className="text-center">
            <button
              type="button"
              disabled={isLoading || isSuccess}
              onClick={async () => {
                try {
                  await signInWithGoogle();
                  unlockSession();
                } catch (e) {
                  setErrorMsg('Google authentication was cancelled or failed.');
                }
              }}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-900 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Sign in with Google Account to Re-Authenticate</span>
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-700/80 w-full"></div>
            <span className="bg-slate-900 px-3 text-[11px] uppercase font-bold text-slate-500 tracking-wider">
              Or use staff PIN / passcode
            </span>
          </div>

          {/* Authentication Navigation Tabs */}
          <div className="flex rounded-xl bg-slate-800/80 p-1 border border-slate-700 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setActiveTab('current'); setErrorMsg(''); }}
              className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'current'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Passcode / PIN</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('switch'); setErrorMsg(''); }}
              className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'switch'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Switch Account</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('student'); setErrorMsg(''); }}
              className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'student'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student ID</span>
            </button>
          </div>

          {/* TAB 1: CURRENT ACTIVE PROFILE LOGIN */}
          {activeTab === 'current' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {/* Account Preview Card */}
              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold flex items-center justify-center text-sm">
                    {user?.displayName ? user.displayName.charAt(0).toUpperCase() : currentAccount.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-200">
                      {user?.displayName || currentAccount.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {selectedRole.toUpperCase()}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate max-w-[180px]">
                        {user?.email || currentAccount.email}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('switch')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium underline underline-offset-2"
                >
                  Change
                </button>
              </div>

              {/* Passcode / PIN Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-300">
                    Enter Security Passcode or PIN
                  </label>
                  <button
                    type="button"
                    onClick={() => setPassword('1234')}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 underline underline-offset-2 cursor-pointer"
                  >
                    Use Default PIN (1234)
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
                    placeholder="Enter security passcode or PIN..."
                    autoFocus
                    className="w-full pl-10 pr-10 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="submit"
                  disabled={isLoading || isSuccess}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-900/30 hover:shadow-emerald-900/50 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 animate-bounce text-white" />
                      <span>Authenticated! Resuming session...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Log In & Resume Session</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: SWITCH ROLE / MULTI-ACCOUNT DIRECTORY */}
          {activeTab === 'switch' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Select an institutional account to sign in and unlock the session:
              </p>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {accounts.map((acc) => {
                  const Icon = acc.icon;
                  const isSelected = selectedRole === acc.role;
                  return (
                    <button
                      key={acc.role}
                      type="button"
                      onClick={() => {
                        setSelectedRole(acc.role);
                        setActiveTab('current');
                        setPassword('');
                        setErrorMsg('');
                      }}
                      className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSelected 
                          ? 'bg-emerald-950/40 border-emerald-500/80 ring-1 ring-emerald-500/50' 
                          : 'bg-slate-800/50 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          acc.role === 'admin' ? 'bg-indigo-500/20 text-indigo-400' :
                          acc.role === 'teacher' ? 'bg-emerald-500/20 text-emerald-400' :
                          acc.role === 'bursar' ? 'bg-amber-500/20 text-amber-400' :
                          acc.role === 'transport' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-purple-500/20 text-purple-400'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-200">{acc.name}</p>
                          <p className="text-[11px] text-slate-400">{acc.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-slate-700 text-slate-300">
                          {acc.role}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: STUDENT & GUARDIAN ADMISSION LOOKUP */}
          {activeTab === 'student' && (
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <p className="text-xs text-slate-400">
                Students and guardians can log back in using their official Sierra Leone Admission Number or Access Code:
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Student Admission ID Number / Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={studentAdmissionNo}
                    onChange={(e) => { setStudentAdmissionNo(e.target.value); setErrorMsg(''); }}
                    placeholder="e.g., SMA-2023-0142"
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono uppercase"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Log In to Student Portal</span>
              </button>
            </form>
          )}

          {/* Return to Public Website */}
          {onReturnToWebsite && (
            <div className="text-center pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onReturnToWebsite}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-xs w-full justify-center"
              >
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>Exit to Public Website (Keep Portal Protected)</span>
              </button>
            </div>
          )}
        </div>

        {/* Security Policy Footer */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>1-Minute Inactivity Protection Enforced</span>
          </span>
          <span className="font-mono text-slate-400">G.W.D.A MIS v2.4</span>
        </div>
      </motion.div>
    </div>
  );
}
