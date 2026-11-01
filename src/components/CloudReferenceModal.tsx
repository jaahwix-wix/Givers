/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  CloudUpload, 
  RefreshCw, 
  FolderArchive, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Database, 
  Trash2, 
  Download, 
  RotateCcw, 
  X, 
  ShieldCheck, 
  Layers, 
  Users, 
  GraduationCap, 
  CreditCard 
} from 'lucide-react';
import { Student, StudentAcademicRecord, NationalExamPrep, StudentFeeLedger } from '../types';
import { SCHOOL_INFO } from '../initialData';
import { 
  saveAllSchoolRecordsToFirestore, 
  createReferenceSnapshot, 
  fetchReferenceSnapshots, 
  deleteReferenceSnapshot, 
  ReferenceSnapshot 
} from '../services/firestoreSync';
import firebaseConfig from '../../firebase-applet-config.json';
import { useAuth } from '../context/AuthContext';

interface CloudReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  records: StudentAcademicRecord[];
  examPreps: NationalExamPrep[];
  fees: StudentFeeLedger[];
  onRestoreData?: (data: {
    students: Student[];
    records: StudentAcademicRecord[];
    examPreps: NationalExamPrep[];
    fees: StudentFeeLedger[];
  }) => void;
}

export default function CloudReferenceModal({
  isOpen,
  onClose,
  students,
  records,
  examPreps,
  fees,
  onRestoreData
}: CloudReferenceModalProps) {
  const { user } = useAuth();
  const [snapshots, setSnapshots] = useState<ReferenceSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Form states for archiving snapshot
  const [showArchiveForm, setShowArchiveForm] = useState(false);
  const [archiveTitle, setArchiveTitle] = useState('');
  const [archiveNotes, setArchiveNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadSnapshots();
    }
  }, [isOpen]);

  const loadSnapshots = async () => {
    setIsLoading(true);
    try {
      const data = await fetchReferenceSnapshots();
      setSnapshots(data);
    } catch (err: any) {
      console.warn('Failed loading snapshots:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAllRecords = async () => {
    setIsSavingAll(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const teachers = JSON.parse(localStorage.getItem('sma_teachers') || '[]');
      const books = JSON.parse(localStorage.getItem('sma_library_books') || '[]');
      const buses = JSON.parse(localStorage.getItem('sma_buses') || '[]');
      const notices = JSON.parse(localStorage.getItem('sma_class_notices') || '[]');

      const result = await saveAllSchoolRecordsToFirestore({
        students,
        records,
        examPreps,
        fees,
        teachers,
        books,
        buses,
        notices
      });

      if (result.success) {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSyncTime(time);
        setSuccessMsg(
          `Successfully saved active records into Firebase database! Synced: ${result.counts.students} students, ${result.counts.records} academic files, ${result.counts.fees} fee ledgers, ${result.counts.teachers} faculty.`
        );
      } else {
        setErrorMsg('Failed to save some collections to Firebase. Please check connection.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error executing save to Firebase.');
    } finally {
      setIsSavingAll(false);
      setTimeout(() => setSuccessMsg(''), 7000);
    }
  };

  const handleCreateArchiveSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsArchiving(true);
    setErrorMsg('');
    try {
      const teachers = JSON.parse(localStorage.getItem('sma_teachers') || '[]');
      const books = JSON.parse(localStorage.getItem('sma_library_books') || '[]');

      const newSnap = await createReferenceSnapshot(
        archiveTitle || `Reference Snapshot Archive (${new Date().toLocaleDateString('en-GB')})`,
        archiveNotes || 'Archived records stored in Firebase database for permanent reference.',
        user?.displayName || `${SCHOOL_INFO.principalName} (Admin)`,
        { students, records, examPreps, fees, teachers, books }
      );

      if (newSnap) {
        setSnapshots(prev => [newSnap, ...prev]);
        setSuccessMsg(`Reference snapshot "${newSnap.title}" successfully archived in Firebase!`);
        setShowArchiveForm(false);
        setArchiveTitle('');
        setArchiveNotes('');
      } else {
        setErrorMsg('Failed to create reference archive snapshot in Firebase.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error creating snapshot.');
    } finally {
      setIsArchiving(false);
      setTimeout(() => setSuccessMsg(''), 6000);
    }
  };

  const handleDeleteSnapshot = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete reference snapshot "${title}" from Firebase?`)) {
      return;
    }
    const ok = await deleteReferenceSnapshot(id);
    if (ok) {
      setSnapshots(prev => prev.filter(s => s.id !== id));
      setSuccessMsg(`Snapshot "${title}" deleted from Firebase.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const handleDownloadSnapshotJSON = (snap: ReferenceSnapshot) => {
    try {
      const jsonStr = JSON.stringify(snap, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Firebase_Reference_Archive_${snap.title.replace(/\s+/g, '_')}_${snap.id}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to download snapshot JSON:', e);
    }
  };

  const handleRestoreSnapshot = (snap: ReferenceSnapshot) => {
    if (!onRestoreData) return;
    if (!window.confirm(`Load reference records from archive "${snap.title}" into active workspace? This will load ${snap.metrics.studentsCount} students and ${snap.metrics.recordsCount} academic files.`)) {
      return;
    }
    onRestoreData({
      students: snap.payload.students || [],
      records: snap.payload.records || [],
      examPreps: snap.payload.examPreps || [],
      fees: snap.payload.fees || []
    });
    setSuccessMsg(`Active workspace updated with reference archive "${snap.title}".`);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col my-8 max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-start justify-between gap-4 border-b border-indigo-900/60">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-2xl shadow-inner">
              <Cloud className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-lg sm:text-xl text-white">
                  Firebase Database Reference Center
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Connected
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Save active school records directly into your Firebase database for historical audit and reference uses.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Database Config Banner */}
        <div className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
            <Database className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-slate-500 dark:text-slate-400">Database ID:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{firebaseConfig.firestoreDatabaseId}</span>
          </div>
          {lastSyncTime && (
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Last saved: {lastSyncTime}
            </span>
          )}
        </div>

        {/* Feedback Alerts */}
        {successMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2.5 font-semibold">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2.5 font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Active Data Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Students</span>
              <span className="text-lg font-black text-slate-900 dark:text-white mt-0.5 block">{students.length}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60">
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">Academic Files</span>
              <span className="text-lg font-black text-indigo-700 dark:text-indigo-300 mt-0.5 block">{records.length}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Tuition Ledgers</span>
              <span className="text-lg font-black text-emerald-700 dark:text-emerald-300 mt-0.5 block">{fees.length}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Saved Archives</span>
              <span className="text-lg font-black text-amber-700 dark:text-amber-300 mt-0.5 block">{snapshots.length}</span>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h4 className="font-black text-sm text-slate-900 dark:text-white">Save Current School Records</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pushes all active student rosters, grade sheets, and tuition balances directly into Firebase Firestore.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                disabled={isSavingAll}
                onClick={handleSaveAllRecords}
                className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-black text-xs transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                <CloudUpload className={`w-4 h-4 ${isSavingAll ? 'animate-bounce' : ''}`} />
                <span>{isSavingAll ? 'Saving Records...' : 'Save All Records to Firebase'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowArchiveForm(!showArchiveForm)}
                className="py-2.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <FolderArchive className="w-4 h-4" />
                <span>{showArchiveForm ? 'Cancel Archive' : 'Archive Reference Snapshot'}</span>
              </button>
            </div>
          </div>

          {/* Archive Snapshot Form Drawer */}
          {showArchiveForm && (
            <form onSubmit={handleCreateArchiveSnapshot} className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-xs text-indigo-900 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                  <FolderArchive className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Create Labeled Reference Snapshot Archive
                </h5>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">Permanent Firebase Document</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Archive Title / Reference Label *
                </label>
                <input
                  type="text"
                  required
                  value={archiveTitle}
                  onChange={(e) => setArchiveTitle(e.target.value)}
                  placeholder="e.g. 2025/2026 Term 3 Final Reference Archive"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Audit Notes / Reference Usage Description
                </label>
                <textarea
                  rows={2}
                  value={archiveNotes}
                  onChange={(e) => setArchiveNotes(e.target.value)}
                  placeholder="Specify purpose of this reference snapshot (e.g. End of term official audit for MBSSE verification)..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowArchiveForm(false)}
                  className="py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isArchiving}
                  className="py-1.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <FolderArchive className="w-3.5 h-3.5" />
                  <span>{isArchiving ? 'Archiving to Firebase...' : 'Confirm & Save to Firebase'}</span>
                </button>
              </div>
            </form>
          )}

          {/* List of Saved Reference Archives in Firebase */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                Saved Reference Archives in Firebase ({snapshots.length})
              </h4>
              <button
                type="button"
                disabled={isLoading}
                onClick={loadSnapshots}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh List</span>
              </button>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
                <p>Loading reference archives from Firebase...</p>
              </div>
            ) : snapshots.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 text-center space-y-2">
                <FolderArchive className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  No reference snapshot archives found in Firebase yet.
                </p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Click <strong className="text-emerald-600 dark:text-emerald-400">"Save All Records to Firebase"</strong> above to push live data, or <strong className="text-indigo-600 dark:text-indigo-400">"Archive Reference Snapshot"</strong> to preserve a dated audit checkpoint.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {snapshots.map(snap => (
                  <div
                    key={snap.id}
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 hover:border-indigo-400 dark:hover:border-indigo-500 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors shadow-2xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-slate-900 dark:text-white text-sm">{snap.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono border border-indigo-100 dark:border-indigo-800">
                          {new Date(snap.savedAt).toLocaleDateString('en-GB')} {new Date(snap.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {snap.notes && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{snap.notes}</p>
                      )}
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-0.5 flex-wrap">
                        <span>👤 By: <strong className="text-slate-700 dark:text-slate-300">{snap.savedBy}</strong></span>
                        <span>👥 {snap.metrics.studentsCount} Students</span>
                        <span>📚 {snap.metrics.recordsCount} Academic Files</span>
                        <span>💳 {snap.metrics.feesCount} Fee Ledgers</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      {onRestoreData && (
                        <button
                          type="button"
                          onClick={() => handleRestoreSnapshot(snap)}
                          className="py-1 px-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors border border-indigo-200 dark:border-indigo-800"
                          title="Load this reference snapshot into active database"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Load</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDownloadSnapshotJSON(snap)}
                        className="py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                        title="Download snapshot JSON file"
                      >
                        <Download className="w-3 h-3" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteSnapshot(snap.id, snap.title)}
                        className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer transition-colors"
                        title="Delete reference archive from Firebase"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Permanent Firestore Persistence Enabled</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
