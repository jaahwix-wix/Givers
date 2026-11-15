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
  X,
  ShieldCheck,
  Layers,
  CloudUpload,
  Flame,
  Server,
} from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';
import { testFirestoreConnection } from '../firebase';
import { saveAllSchoolRecordsToFirestore } from '../services/firebaseSync';
import { Student, StudentAcademicRecord, NationalExamPrep, StudentFeeLedger } from '../types';

interface FirebaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  students?: Student[];
  records?: StudentAcademicRecord[];
  examPreps?: NationalExamPrep[];
  fees?: StudentFeeLedger[];
}

const COLLECTIONS_LIST = [
  { name: 'students', desc: 'Student admission files, guardian contacts & verification status' },
  { name: 'academic_records', desc: 'Terminal continuous assessments, exam grades & conduct' },
  { name: 'fee_ledgers', desc: 'Term 1–3 tuition billing, SLE receipts & payment ledgers' },
  { name: 'exam_preps', desc: 'NPSE, BECE, WASSCE & tertiary exam readiness tracking' },
  { name: 'teachers', desc: 'Faculty directory, access codes & salary allocations' },
  { name: 'assignments / submissions', desc: 'Coursework assignments & student answer submissions' },
  { name: 'class_notices / announcements', desc: 'Official bulletins & GSM SMS broadcast alerts' },
  { name: 'buses / bus_assignments', desc: 'Fleet manifest, routes, drivers & commuter allocations' },
  { name: 'daily_attendance / incidents', desc: 'Daily roll calls & student disciplinary incident logs' },
  { name: 'library_books / library_checkouts', desc: 'Library catalog & active book loan records' },
  { name: 'reference_snapshots / reference_audit_logs', desc: 'Permanent audit trail & labeled archive checkpoints' },
];

export default function SupabaseConfigModal({
  isOpen,
  onClose,
  students = [],
  records = [],
  examPreps = [],
  fees = [],
}: FirebaseConfigModalProps) {
  const [activeTab, setActiveTab] = useState<'status' | 'collections'>('status');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    connected: boolean;
    message: string;
    latencyMs?: number;
  }>({
    tested: false,
    connected: false,
    message: '',
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPushing, setIsPushing] = useState(false);
  const [pushMessage, setPushMessage] = useState('');

  const firestoreConsoleUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${firebaseConfig.firestoreDatabaseId}/data`;

  useEffect(() => {
    if (isOpen) {
      runTest();
    }
  }, [isOpen]);

  const runTest = async () => {
    setIsTesting(true);
    const start = performance.now();
    try {
      const ok = await testFirestoreConnection();
      const latencyMs = Math.round(performance.now() - start);
      window.dispatchEvent(new Event('sma_firebase_config_changed'));
      setTestResult({
        tested: true,
        connected: ok,
        latencyMs,
        message: ok
          ? `Connected cleanly to Cloud Firestore database "${firebaseConfig.firestoreDatabaseId}" in project "${firebaseConfig.projectId}".`
          : 'Cloud Firestore is currently unreachable or offline. Changes remain queued in local browser cache and will auto-sync on reconnect.',
      });
    } catch (err: any) {
      setTestResult({
        tested: true,
        connected: false,
        message: err?.message || 'Unable to verify Firestore connection',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopy = (label: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedId(label);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePushData = async () => {
    setIsPushing(true);
    setPushMessage('');
    try {
      const teachers = JSON.parse(localStorage.getItem('sma_teachers') || '[]');
      const books = JSON.parse(localStorage.getItem('sma_library_books') || '[]');
      const buses = JSON.parse(localStorage.getItem('sma_buses') || '[]');
      const notices = JSON.parse(localStorage.getItem('sma_class_notices') || '[]');

      const res = await saveAllSchoolRecordsToFirestore({
        students,
        records,
        examPreps,
        fees,
        teachers,
        books,
        buses,
        notices,
      });

      if (res.success) {
        setPushMessage(
          `Successfully synchronized ${res.counts.students} students, ${res.counts.records} grade sheets, ${res.counts.fees} fee ledgers, and all school records to Cloud Firestore!`
        );
      } else {
        setPushMessage('Some collections could not be pushed cleanly. Verify Firestore rules and network connection.');
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
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Firebase Hosting Database (Cloud Firestore)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Live Hosted DB
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Primary real-time database engine for Givers World Mission Diplomats Academy & College
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
            <span>Connection & Sync</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('collections')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'collections'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Firestore Collections</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'status' && (
            <div className="space-y-6">
              {/* Status Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                  testResult.connected
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200'
                    : 'bg-amber-50/70 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200'
                }`}
              >
                {testResult.connected ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm">
                      {testResult.connected
                        ? 'Cloud Firestore Hosting Database: Active & Ready'
                        : 'Checking Cloud Firestore Connection...'}
                    </h4>
                    {testResult.latencyMs !== undefined && (
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-900/80 font-bold">
                        {testResult.latencyMs}ms latency
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-1 leading-relaxed opacity-90">
                    {testResult.message || 'Connecting to Firebase project...'}
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

              {/* Project Metadata Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-400">Firebase Project ID</span>
                    <button
                      type="button"
                      onClick={() => handleCopy('projectId', firebaseConfig.projectId)}
                      className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === 'projectId' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === 'projectId' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="font-mono font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="truncate">{firebaseConfig.projectId}</span>
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-400">Firestore Database ID</span>
                    <button
                      type="button"
                      onClick={() => handleCopy('dbId', firebaseConfig.firestoreDatabaseId)}
                      className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === 'dbId' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === 'dbId' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="font-mono font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="truncate">{firebaseConfig.firestoreDatabaseId}</span>
                  </p>
                </div>
              </div>

              {/* Sync Actions */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white text-xs">
                      Push All Local School Records to Cloud Firestore
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Batch-saves all current students, continuous assessments, tuition ledgers, staff, library, and notices directly to the hosted Firestore database.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handlePushData}
                    disabled={isPushing}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                  >
                    <CloudUpload className={`w-3.5 h-3.5 ${isPushing ? 'animate-bounce' : ''}`} />
                    <span>{isPushing ? 'Syncing Data...' : 'Sync All to Firestore'}</span>
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

          {activeTab === 'collections' && (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    Active Cloud Firestore Collections
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Real-time <code className="font-mono text-emerald-600">onSnapshot</code> listeners synchronize these collections across all staff browsers automatically.
                  </p>
                </div>

                <a
                  href={firestoreConsoleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors inline-flex items-center gap-1 shrink-0"
                >
                  <span>Firebase Console</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {COLLECTIONS_LIST.map((col) => (
                  <div
                    key={col.name}
                    className="p-3.5 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{col.name}</span>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">{col.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Hosted Project: <strong className="font-mono text-slate-600 dark:text-slate-300">{firebaseConfig.projectId}</strong>
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
