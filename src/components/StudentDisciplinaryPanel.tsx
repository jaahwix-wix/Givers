/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Award, 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  ShieldAlert, 
  Bookmark, 
  Trash2, 
  X, 
  CheckCircle2, 
  FileText 
} from 'lucide-react';
import { Student } from '../types';
import { syncFirestoreCollection, batchSaveToFirestore, deleteFromFirestore } from '../services/firestoreSync';
import { recordDataEntry } from '../utils/referenceLog';

interface StudentDisciplinaryPanelProps {
  students: Student[];
}

interface IncidentRecord {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  type: 'Commendation' | 'Warning' | 'Incident';
  category: string;
  description: string;
  actionTaken: string; // e.g., "Certificate of Honesty issued" or "1-day detention"
  date: string;
  issuerName: string;
}

const DEFAULT_INCIDENTS: IncidentRecord[] = [];

export default function StudentDisciplinaryPanel({ students }: StudentDisciplinaryPanelProps) {
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [incidentToDelete, setIncidentToDelete] = useState<IncidentRecord | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Commendation' | 'Warning' | 'Incident'>('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form Fields
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [formType, setFormType] = useState<'Commendation' | 'Warning' | 'Incident'>('Commendation');
  const [formCategory, setFormCategory] = useState('Academic Excellence');
  const [formDescription, setFormDescription] = useState('');
  const [formAction, setFormAction] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formIssuer, setFormIssuer] = useState('');

  useEffect(() => {
    const unsub = syncFirestoreCollection<IncidentRecord>(
      'incidents',
      'sma_incidents',
      (items) => setIncidents(items),
      DEFAULT_INCIDENTS
    );

    const handleWiped = () => {
      setIncidents([]);
    };

    window.addEventListener('sma_database_wiped', handleWiped);

    return () => {
      unsub();
      window.removeEventListener('sma_database_wiped', handleWiped);
    };
  }, []);

  // Save Helper
  const saveIncidents = (newIncidents: IncidentRecord[]) => {
    setIncidents(newIncidents);
    try {
      localStorage.setItem('sma_incidents', JSON.stringify(newIncidents));
    } catch {}
    batchSaveToFirestore('incidents', newIncidents);
  };

  const handleOpenModal = () => {
    setSelectedStudentId(students.length > 0 ? students[0].id : '');
    setFormType('Commendation');
    setFormCategory('Leadership');
    setFormDescription('');
    setFormAction('');
    setFormDate(new Date().toISOString().substring(0, 10));
    setFormIssuer('Class Teacher');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const student = students.find(s => s.id === selectedStudentId);
    if (!student) return;

    const newIncident: IncidentRecord = {
      id: `inc-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      className: student.currentClass,
      type: formType,
      category: formCategory,
      description: formDescription,
      actionTaken: formAction,
      date: formDate,
      issuerName: formIssuer
    };

    const updated = [newIncident, ...incidents];
    saveIncidents(updated);

    recordDataEntry({
      type: 'Disciplinary Incident Record',
      category: 'Registry',
      title: `${formType}: ${student.name}`,
      summary: `${formCategory} - ${formDescription}. Action: ${formAction}. Issued by: ${formIssuer}.`,
      targetId: newIncident.id,
      details: newIncident,
      status: 'Saved & Active'
    });

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    const inc = incidents.find(i => i.id === id);
    if (inc) {
      setIncidentToDelete(inc);
    }
  };

  const confirmDeleteIncident = () => {
    if (!incidentToDelete) return;
    const inc = incidentToDelete;
    const updated = incidents.filter(i => i.id !== inc.id);
    saveIncidents(updated);
    deleteFromFirestore('incidents', inc.id);

    recordDataEntry({
      type: 'Disciplinary Incident Record',
      category: 'Registry',
      title: `Incident Removed: ${inc.studentName}`,
      summary: `Removed ${inc.type} record ("${inc.category}") for ${inc.studentName}. Archived in Reference Ledger.`,
      targetId: inc.id,
      details: inc,
      status: 'Deleted From Registry'
    });

    setIncidentToDelete(null);
  };

  // Filter list
  const filteredIncidents = incidents.filter(inc => {
    const matchesSearch = inc.studentName.toLowerCase().includes(search.toLowerCase()) || 
                          inc.category.toLowerCase().includes(search.toLowerCase()) ||
                          inc.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'All' || inc.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6" id="disciplinary-panel">
      {/* Search & Filter Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name, category, behavior notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-700 font-semibold"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="bg-transparent border-none focus:outline-none cursor-pointer pr-1"
            >
              <option value="All">All Incidents & Merits</option>
              <option value="Commendation">Commendations Only</option>
              <option value="Warning">Warnings Only</option>
              <option value="Incident">Incidents Only</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleOpenModal}
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Log Incident / Merit
        </button>
      </div>

      {/* Grid of incidents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="incidents-feed-grid">
        {filteredIncidents.map(inc => {
          const typeStyles = {
            Commendation: {
              card: 'border-emerald-100 bg-emerald-50/10 hover:border-emerald-200',
              badge: 'bg-emerald-50 text-emerald-700 border-emerald-100',
              icon: <Award className="w-5 h-5 text-emerald-600" />
            },
            Warning: {
              card: 'border-amber-100 bg-amber-50/10 hover:border-amber-200',
              badge: 'bg-amber-50 text-amber-700 border-amber-100',
              icon: <AlertTriangle className="w-5 h-5 text-amber-600" />
            },
            Incident: {
              card: 'border-rose-100 bg-rose-50/10 hover:border-rose-200',
              badge: 'bg-rose-50 text-rose-700 border-rose-100',
              icon: <ShieldAlert className="w-5 h-5 text-rose-600" />
            }
          };

          const style = typeStyles[inc.type] || typeStyles.Incident;

          return (
            <div 
              key={inc.id} 
              className={`border rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between ${style.card}`}
            >
              <div className="space-y-4">
                {/* Header info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white shadow-xs border border-slate-100 flex items-center justify-center">
                      {style.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs leading-none">{inc.studentName}</h4>
                      <span className="text-[10px] text-slate-400 block mt-1 font-mono">{inc.className} • Class Level</span>
                    </div>
                  </div>

                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${style.badge}`}>
                    {inc.type}
                  </span>
                </div>

                {/* Body details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800">
                    <Bookmark className="w-3.5 h-3.5 text-slate-400" /> Category: {inc.category}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium bg-white/60 p-3 rounded-xl border border-slate-50">
                    {inc.description}
                  </p>
                </div>

                {/* Outcome */}
                <div className="text-xs space-y-1 bg-white/40 border border-slate-100 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Action Taken / Reward Issued</span>
                  <p className="text-slate-800 font-bold">{inc.actionTaken}</p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span className="flex items-center gap-1 font-mono">
                  <Calendar className="w-3.5 h-3.5" /> {inc.date}
                </span>

                <div className="flex items-center gap-2">
                  <span>Issued by: <span className="font-bold text-slate-700">{inc.issuerName}</span></span>
                  <button
                    onClick={() => handleDelete(inc.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                    title="Delete log entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredIncidents.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white border border-slate-100 rounded-2xl">
            <FileText className="w-12 h-12 mx-auto text-slate-200 mb-2" />
            <p className="text-sm font-semibold text-slate-600">No disciplinary or commendation records match your search.</p>
            <p className="text-xs text-slate-400 mt-1">Use the "Log Incident / Merit" button to register behavior achievements.</p>
          </div>
        )}
      </div>

      {/* INCIDENT LOGGING MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-xl border border-slate-100 overflow-hidden text-left">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <ShieldAlert className="w-5 h-5 text-indigo-600" /> Log Student Incident & Merit Awards
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[500px] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Target Student</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-700 bg-white cursor-pointer font-semibold"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.currentClass})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Log Record Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 text-slate-700 bg-white cursor-pointer font-semibold"
                  >
                    <option value="Commendation">Digital Commendation / Merit</option>
                    <option value="Warning">Disciplinary Warning</option>
                    <option value="Incident">Incident Report Log</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Category Tag</label>
                  <input
                    type="text"
                    required
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="e.g. Leadership, Integrity, Absenteeism"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 text-slate-700 font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Behavioral Incident Details</label>
                <textarea
                  required
                  rows={4}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe the incident occurrence, outstanding achievement details, or behavioral warnings explicitly..."
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 text-slate-700 leading-normal"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Action Taken / Reward Issued</label>
                <input
                  type="text"
                  required
                  value={formAction}
                  onChange={(e) => setFormAction(e.target.value)}
                  placeholder="e.g. Assigned afterschool cleanup, Certificate of Honour, House points"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 text-slate-700 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Log Date</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-slate-700 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Issuer Staff Member</label>
                  <input
                    type="text"
                    required
                    value={formIssuer}
                    onChange={(e) => setFormIssuer(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 text-slate-700 font-semibold"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Publish Log Entry
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Incident */}
      {incidentToDelete && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIncidentToDelete(null);
          }}
        >
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Delete {incidentToDelete.type} Record?</h3>
                <p className="text-xs text-slate-500">Remove entry from student's disciplinary record.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
              <p className="font-bold text-slate-900">{incidentToDelete.studentName} ({incidentToDelete.className})</p>
              <p className="text-slate-600">Category: {incidentToDelete.category}</p>
              <p className="text-slate-500 line-clamp-2">"{incidentToDelete.description}"</p>
              <p className="text-indigo-700 font-medium">Action: {incidentToDelete.actionTaken}</p>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 leading-relaxed">
              Record will be archived in the permanent Institutional Reference Ledger.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIncidentToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteIncident}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
