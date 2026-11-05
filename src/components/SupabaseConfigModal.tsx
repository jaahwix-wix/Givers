/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  RefreshCw, 
  ExternalLink, 
  Key, 
  Globe, 
  X, 
  ShieldCheck, 
  Code, 
  Layers, 
  Save, 
  RotateCcw,
  Eye,
  EyeOff,
  CloudUpload
} from 'lucide-react';
import { 
  getSupabaseUrl, 
  getSupabaseAnonKey, 
  saveSupabaseCredentials, 
  resetSupabaseCredentials, 
  testSupabaseConnection, 
  SUPABASE_SQL_SETUP_SCRIPT,
  DEFAULT_SUPABASE_URL,
  DEFAULT_SUPABASE_ANON_KEY
} from '../supabase';
import { saveAllSchoolRecordsToSupabase } from '../services/supabaseSync';
import { Student, StudentAcademicRecord, NationalExamPrep, StudentFeeLedger } from '../types';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  students?: Student[];
  records?: StudentAcademicRecord[];
  examPreps?: NationalExamPrep[];
  fees?: StudentFeeLedger[];
}

export default function SupabaseConfigModal({
  isOpen,
  onClose,
  students = [],
  records = [],
  examPreps = [],
  fees = []
}: SupabaseConfigModalProps) {
  const [activeTab, setActiveTab] = useState<'status' | 'sql' | 'credentials'>('status');

  // Supabase Settings form
  const [urlInput, setUrlInput] = useState(getSupabaseUrl());
  const [keyInput, setKeyInput] = useState(getSupabaseAnonKey());
  const [showKey, setShowKey] = useState(false);

  // Connection testing state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    connected: boolean;
    tableExists: boolean;
    message: string;
    latencyMs?: number;
  }>({
    tested: false,
    success: false,
    connected: false,
    tableExists: false,
    message: ''
  });

  // Copy feedback states
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Push data state
  const [isPushing, setIsPushing] = useState(false);
  const [pushMessage, setPushMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setUrlInput(getSupabaseUrl());
      setKeyInput(getSupabaseAnonKey());
      runTest();
    }
  }, [isOpen]);

  const runTest = async () => {
    setIsTesting(true);
    try {
      const res = await testSupabaseConnection();
      setTestResult({
        tested: true,
        ...res
      });
    } catch (err: any) {
      setTestResult({
        tested: true,
        success: false,
        connected: false,
        tableExists: false,
        message: err?.message || 'Connection failed'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseCredentials(urlInput, keyInput);
    runTest();
  };

  const handleResetDefaults = () => {
    resetSupabaseCredentials();
    setUrlInput(DEFAULT_SUPABASE_URL);
    setKeyInput(DEFAULT_SUPABASE_ANON_KEY);
    runTest();
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP_SCRIPT);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handlePushData = async () => {
    setIsPushing(true);
    setPushMessage('');
    try {
      const teachers = JSON.parse(localStorage.getItem('sma_teachers') || '[]');
      const books = JSON.parse(localStorage.getItem('sma_library_books') || '[]');
      const buses = JSON.parse(localStorage.getItem('sma_buses') || '[]');
      const notices = JSON.parse(localStorage.getItem('sma_class_notices') || '[]');

      const res = await saveAllSchoolRecordsToSupabase({
        students,
        records,
        examPreps,
        fees,
        teachers,
        books,
        buses,
        notices
      });

      if (res.success) {
        setPushMessage(`Successfully synchronized ${res.counts.students} students, ${res.counts.records} grade sheets, and all school data to Supabase!`);
      } else {
        setPushMessage('Data push completed with some local notes. Ensure the school_documents table is created in Supabase.');
      }
    } catch (err: any) {
      setPushMessage(`Sync warning: ${err?.message || 'Check connection'}`);
    } finally {
      setIsPushing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Supabase Cloud Database
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Postgres Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Primary persistent database engine for Givers World Mission Diplomats Academy & College
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'status'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Connection & Health</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sql')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'sql'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>SQL Schema Setup</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('credentials')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'credentials'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>API Credentials</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: Status */}
          {activeTab === 'status' && (
            <div className="space-y-6">
              {/* Status Banner */}
              <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                testResult.connected && testResult.tableExists
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200'
                  : testResult.connected
                  ? 'bg-amber-50/70 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200'
                  : 'bg-rose-50/70 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200'
              }`}>
                {testResult.connected && testResult.tableExists ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm">
                      {testResult.connected && testResult.tableExists
                        ? 'Supabase Cloud Database: Active & Ready'
                        : testResult.connected
                        ? 'Connected to Supabase (SQL Setup Required)'
                        : 'Checking Supabase Connection...'}
                    </h4>
                    {testResult.latencyMs !== undefined && (
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-900/80 font-bold">
                        {testResult.latencyMs}ms latency
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-1 leading-relaxed opacity-90">
                    {testResult.message || 'Connecting to endpoint...'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={runTest}
                  disabled={isTesting}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-current font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Testing...' : 'Test Now'}</span>
                </button>
              </div>

              {/* Quick Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400">Database Engine</span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-emerald-500" /> PostgreSQL
                  </p>
                  <span className="text-[11px] text-slate-500">Realtime enabled</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400">Target Schema</span>
                  <p className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-500" /> school_documents
                  </p>
                  <span className="text-[11px] text-slate-500">
                    {testResult.tableExists ? 'Table verified' : 'Ready to create'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400">Offline Resilience</span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Active Local Cache
                  </p>
                  <span className="text-[11px] text-slate-500">Zero data loss on offline</span>
                </div>
              </div>

              {/* Sync Actions */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white text-xs">
                      Push All Local School Records to Supabase
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Batch uploads all current students, academic continuous assessments, and fee receipts to your Supabase project.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handlePushData}
                    disabled={isPushing}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                  >
                    <CloudUpload className={`w-3.5 h-3.5 ${isPushing ? 'animate-bounce' : ''}`} />
                    <span>{isPushing ? 'Pushing Data...' : 'Sync to Supabase'}</span>
                  </button>
                </div>

                {pushMessage && (
                  <p className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                    {pushMessage}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SQL Setup */}
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    Supabase SQL Initialization Script
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Execute this script once in your Supabase SQL Editor. It creates the <code className="font-mono text-emerald-600">school_documents</code>, <code className="font-mono text-emerald-600">reference_snapshots</code>, and <code className="font-mono text-emerald-600">reference_audit_logs</code> tables with Row Level Security (RLS) and Realtime streaming.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors inline-flex items-center gap-1"
                  >
                    <span>Supabase Dashboard</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
                  </button>
                </div>
              </div>

              {/* Instructions steps */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-800">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Step 1:</span> Copy this SQL script using the button above.
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-800">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Step 2:</span> Go to your Supabase project & click <strong>SQL Editor</strong>.
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-800">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Step 3:</span> Paste the script and click <strong>Run</strong> (Ctrl+Enter).
                </div>
              </div>

              {/* Code Viewer */}
              <div className="relative rounded-2xl bg-slate-950 p-4 border border-slate-800 font-mono text-[11px] text-slate-200 overflow-x-auto max-h-72 leading-relaxed">
                <pre>{SUPABASE_SQL_SETUP_SCRIPT}</pre>
              </div>
            </div>
          )}

          {/* TAB 3: Credentials */}
          {activeTab === 'credentials' && (
            <form onSubmit={handleSaveCredentials} className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  Supabase Project Credentials
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Found in your Supabase project under <strong>Settings &gt; API</strong>.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Project URL (VITE_SUPABASE_URL)
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://your-project-ref.supabase.co"
                      required
                      className="w-full pl-9 pr-24 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(urlInput);
                        setCopiedUrl(true);
                        setTimeout(() => setCopiedUrl(false), 2000);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1"
                    >
                      {copiedUrl ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Anon / Public Key (VITE_SUPABASE_ANON_KEY)
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                      required
                      className="w-full pl-9 pr-28 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600"
                        title={showKey ? 'Hide key' : 'Show key'}
                      >
                        {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(keyInput);
                          setCopiedKey(true);
                          setTimeout(() => setCopiedKey(false), 2000);
                        }}
                        className="px-2 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1"
                      >
                        {copiedKey ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to App Defaults</span>
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save & Test Reconnect</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Current Endpoint: <strong className="font-mono text-slate-600 dark:text-slate-300">{getSupabaseUrl().replace('https://', '')}</strong>
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
