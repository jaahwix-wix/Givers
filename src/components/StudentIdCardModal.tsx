/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useMemo } from 'react';
import { 
  X, 
  Printer, 
  Check, 
  RotateCw, 
  Sliders, 
  Search, 
  CheckSquare, 
  Square,
  ShieldCheck,
  CreditCard,
  User,
  Phone,
  MapPin,
  Calendar
} from 'lucide-react';
import { Student } from '../types';
import { SCHOOL_INFO } from '../initialData';

interface StudentIdCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  initialStudent?: Student | null;
}

type CardTheme = 'navy' | 'emerald' | 'amber';

export default function StudentIdCardModal({ isOpen, onClose, students, initialStudent }: StudentIdCardModalProps) {
  // Theme state
  const [selectedTheme, setSelectedTheme] = useState<CardTheme>('navy');
  // Card face state: 'front' | 'back'
  const [cardFace, setCardFace] = useState<'front' | 'back'>('front');
  
  // Selection state for batch print
  const [selectedStudentIds, setSelectedStudentIds] = useState<Record<string, boolean>>({});
  // Filter states inside generator
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('All');

  // Sync initial student if supplied
  React.useEffect(() => {
    if (initialStudent) {
      setSelectedStudentIds({ [initialStudent.id]: true });
    } else {
      // Default to selecting all active students initially
      const activeIds: Record<string, boolean> = {};
      students.filter(s => s.status === 'Active').forEach(s => {
        activeIds[s.id] = true;
      });
      setSelectedStudentIds(activeIds);
    }
  }, [initialStudent, isOpen, students]);

  if (!isOpen) return null;

  // Filter students for the batch checklist
  const filteredStudents = students.filter(s => {
    if (s.status !== 'Active') return false;
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = classFilter === 'All' || s.currentClass === classFilter;
    return matchesSearch && matchesClass;
  });

  // Unique classes for filtering
  const uniqueClasses = Array.from(new Set(students.map(s => s.currentClass))).sort();

  // Handle individual toggle
  const toggleStudentSelection = (id: string) => {
    setSelectedStudentIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Select all visible / Deselect all visible
  const selectedVisibleCount = filteredStudents.filter(s => selectedStudentIds[s.id]).length;
  const toggleAllVisible = () => {
    const newVal = selectedVisibleCount < filteredStudents.length;
    setSelectedStudentIds(prev => {
      const updated = { ...prev };
      filteredStudents.forEach(s => {
        updated[s.id] = newVal;
      });
      return updated;
    });
  };

  // Get selected students for preview & print
  const selectedStudentsToPrint = students.filter(s => selectedStudentIds[s.id] && s.status === 'Active');

  // Theme styling configurations
  const themeStyles = {
    navy: {
      primaryBg: 'bg-slate-900',
      primaryText: 'text-indigo-600',
      border: 'border-slate-800',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      headerGradient: 'from-slate-900 to-indigo-950',
      cardBorder: 'border-indigo-600/30',
      stripBg: 'bg-indigo-900',
      stripText: 'text-indigo-100',
      accentColor: '#4f46e5',
    },
    emerald: {
      primaryBg: 'bg-emerald-950',
      primaryText: 'text-emerald-600',
      border: 'border-emerald-800',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      headerGradient: 'from-emerald-950 to-teal-950',
      cardBorder: 'border-emerald-600/30',
      stripBg: 'bg-emerald-900',
      stripText: 'text-emerald-100',
      accentColor: '#10b981',
    },
    amber: {
      primaryBg: 'bg-slate-900',
      primaryText: 'text-amber-600',
      border: 'border-amber-800',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-100',
      headerGradient: 'from-slate-900 to-amber-950',
      cardBorder: 'border-amber-600/30',
      stripBg: 'bg-amber-950',
      stripText: 'text-amber-100',
      accentColor: '#f59e0b',
    },
  };

  const style = themeStyles[selectedTheme];

  // Printable layout window trigger
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn" id="id-card-generator-modal">
      <div className="bg-white rounded-3xl w-full max-w-6xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[80vh] print:absolute print:inset-0 print:bg-white print:h-auto print:w-auto print:shadow-none print:border-none print:rounded-none">
        
        {/* Left Side: Batch Management Controls (Hidden when printing) */}
        <div className="w-full md:w-80 border-r border-slate-100 flex flex-col h-1/2 md:h-full bg-slate-50/50 print:hidden shrink-0">
          <div className="p-5 border-b border-slate-100">
            <h2 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" /> ID Card Registry
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Select students for batch generation</p>
          </div>

          {/* Quick Search */}
          <div className="p-4 space-y-2 border-b border-slate-100">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input 
                type="text" 
                placeholder="Search candidates..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 placeholder-slate-400"
              />
            </div>

            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">All Class Levels</option>
              {uniqueClasses.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          {/* Student Batch Selection List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <div className="flex items-center justify-between px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1.5">
              <span>{filteredStudents.length} Students found</span>
              <button 
                onClick={toggleAllVisible}
                className="text-indigo-600 hover:underline cursor-pointer"
              >
                {selectedVisibleCount === filteredStudents.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {filteredStudents.map(student => {
              const isSelected = !!selectedStudentIds[student.id];
              return (
                <button
                  key={student.id}
                  onClick={() => toggleStudentSelection(student.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                    isSelected 
                      ? 'bg-white border-indigo-100 shadow-xs text-slate-800' 
                      : 'border-transparent text-slate-500 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                    <div className="truncate">
                      <p className="font-bold text-xs truncate">{student.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{student.currentClass} • {student.admissionNumber}</p>
                    </div>
                  </div>
                  {student.profileImage && (
                    <img 
                      src={student.profileImage} 
                      alt="" 
                      className="w-7 h-7 rounded-lg object-cover shrink-0 border border-slate-200"
                    />
                  )}
                </button>
              );
            })}

            {filteredStudents.length === 0 && (
              <p className="text-center text-xs text-slate-400 italic py-8">No matching students found</p>
            )}
          </div>

          {/* Selected Footer count */}
          <div className="p-4 border-t border-slate-100 bg-slate-50">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
              <span>Batch Selected:</span>
              <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold">
                {selectedStudentsToPrint.length} Students
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Preview & Print Trigger */}
        <div className="flex-1 flex flex-col h-1/2 md:h-full print:h-auto print:w-auto overflow-hidden">
          
          {/* Header Controller Bar (Hidden when printing) */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between print:hidden shrink-0">
            <div>
              <h2 className="font-extrabold text-slate-800 text-lg">Student ID Card Generator</h2>
              <p className="text-xs text-slate-400">Generate pocket-sized printable administrative badges</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Interactive Styling Workspace (Hidden when printing) */}
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between print:hidden shrink-0">
            {/* Design Presets */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" /> Design Preset:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSelectedTheme('navy')}
                  className={`py-1 px-3.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    selectedTheme === 'navy' 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Oceanic Trust
                </button>
                <button
                  onClick={() => setSelectedTheme('emerald')}
                  className={`py-1 px-3.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    selectedTheme === 'emerald' 
                      ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Salone Emerald
                </button>
                <button
                  onClick={() => setSelectedTheme('amber')}
                  className={`py-1 px-3.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    selectedTheme === 'amber' 
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Academic Gold
                </button>
              </div>
            </div>

            {/* Interactive Toggle Card Face */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCardFace(prev => prev === 'front' ? 'back' : 'front')}
                className="py-1 px-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100/50 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" /> Flip Preview Face ({cardFace === 'front' ? 'FRONT' : 'BACK'})
              </button>

              <button
                onClick={handlePrint}
                disabled={selectedStudentsToPrint.length === 0}
                className="py-1.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-extrabold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Print Selected ({selectedStudentsToPrint.length})
              </button>
            </div>
          </div>

          {/* LIVE WORKSPACE & SCROLLABLE CARDS */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-100/40 print:bg-white print:p-0 print:overflow-visible">
            
            {/* INSTRUCTIONS BOX (Hidden when printing) */}
            {selectedStudentsToPrint.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center space-y-3 bg-white p-6 rounded-2xl border border-dashed border-slate-200">
                <CreditCard className="w-12 h-12 text-slate-300" />
                <h3 className="font-extrabold text-slate-700 text-sm">No Active Students Selected</h3>
                <p className="text-xs text-slate-400 max-w-sm">Use the left directory panel to select students for generating and printing official school identification cards.</p>
              </div>
            ) : (
              <div className="space-y-8 print:space-y-0 print:block">
                
                {/* Active Interactive Preview Header (Hidden when printing) */}
                <div className="flex justify-between items-center border-b border-slate-200/60 pb-3 print:hidden">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Interactive Live Preview</span>
                  <span className="text-[10px] font-bold text-slate-500">Card Dimensions: CR-80 Standard (85.6mm x 53.98mm)</span>
                </div>

                {/* Grid container for cards. On normal screens we display a preview grid with cardface toggled. On print, we lay them out beautifully */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 justify-items-center print:grid print:grid-cols-2 print:gap-x-4 print:gap-y-6 print:p-0 print:bg-white">
                  
                  {selectedStudentsToPrint.map((student) => {
                    const initials = student.name.split(' ').map(n => n[0]).join('');
                    const colorStyles = {
                      emerald: 'bg-emerald-50 border-emerald-100 text-emerald-800',
                      blue: 'bg-blue-50 border-blue-100 text-blue-800',
                      purple: 'bg-purple-50 border-purple-100 text-purple-800',
                      rose: 'bg-rose-50 border-rose-100 text-rose-800',
                      pink: 'bg-pink-50 border-pink-100 text-pink-800',
                      amber: 'bg-amber-50 border-amber-100 text-amber-800',
                      teal: 'bg-teal-50 border-teal-100 text-teal-800',
                      cyan: 'bg-cyan-50 border-cyan-100 text-cyan-800',
                      sky: 'bg-sky-50 border-sky-100 text-sky-800',
                    };
                    const sColor = (student.profileColor || 'emerald') as keyof typeof colorStyles;
                    const chosenStyle = colorStyles[sColor] || colorStyles.emerald;

                    return (
                      <React.Fragment key={student.id}>
                        {/* Interactive Screen Preview Container (Hidden when printing because we show both front & back on print!) */}
                        <div className="flex flex-col items-center gap-3 print:hidden">
                          {/* Card Envelope */}
                          <div 
                            className={`w-[340px] h-[215px] bg-white rounded-2xl border ${style.cardBorder} shadow-lg relative overflow-hidden flex flex-col justify-between`}
                            id={`id-card-preview-${student.id}`}
                          >
                            {cardFace === 'front' ? (
                              /* ==================== CARD FRONT ==================== */
                              <>
                                {/* National Flag Top Stripe */}
                                <div className="flex h-[3px] w-full overflow-hidden absolute top-0 left-0">
                                  <div className="bg-[#10b981] w-1/3"></div>
                                  <div className="bg-white w-1/3"></div>
                                  <div className="bg-[#3b82f6] w-1/3"></div>
                                </div>

                                {/* Crest & Header Panel */}
                                <div className={`px-4 pt-3.5 pb-2.5 bg-gradient-to-r ${style.headerGradient} text-white flex items-center gap-2.5 border-b border-slate-100/10`}>
                                  <img 
                                    src={SCHOOL_INFO.logo} 
                                    alt={`${SCHOOL_INFO.name} Logo`} 
                                    className="w-7 h-7 rounded-lg bg-white object-contain p-0.5 shrink-0 border border-white/40 shadow-xs"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="truncate">
                                    <h3 className="font-black text-[10px] uppercase tracking-wide leading-tight">{SCHOOL_INFO.name}</h3>
                                    <p className="text-[7px] text-indigo-200/80 font-bold uppercase tracking-widest mt-0.5">KAMBIA, SIERRA LEONE</p>
                                  </div>
                                </div>

                                {/* Body Panel */}
                                <div className="p-4 flex-1 flex gap-4">
                                  {/* Left: Avatar with elegant layout */}
                                  <div className="w-[72px] h-[72px] shrink-0 relative">
                                    {student.profileImage ? (
                                      <img 
                                        src={student.profileImage} 
                                        alt={student.name} 
                                        referrerPolicy="no-referrer"
                                        className="w-full h-full object-cover rounded-xl border border-slate-200/80 shadow-xs"
                                      />
                                    ) : (
                                      <div className={`w-full h-full rounded-xl flex items-center justify-center font-black text-lg ${chosenStyle} border border-slate-200/40`}>
                                        {initials}
                                      </div>
                                    )}
                                    {/* Holographic school badge */}
                                    <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 border-2 border-white flex items-center justify-center shadow-xs text-[6px] font-black text-amber-950 rotate-12">
                                      NS
                                    </div>
                                  </div>

                                  {/* Right: Info rows */}
                                  <div className="flex-1 min-w-0 text-[10px] space-y-1.5 text-slate-700">
                                    <div>
                                      <p className="text-[7px] font-black text-slate-400 uppercase tracking-wider">Student Name</p>
                                      <p className="font-extrabold text-slate-800 truncate text-[11px] leading-tight">{student.name}</p>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-1">
                                      <div>
                                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-wider">Admission ID</p>
                                        <p className="font-black text-indigo-600 font-mono text-[9px]">{student.admissionNumber}</p>
                                      </div>
                                      <div>
                                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-wider">
                                          {student.universityProgram ? 'Program / Year' : 'Grade / Class'}
                                        </p>
                                        <p className="font-extrabold text-slate-800 truncate">
                                          {student.currentClass} {student.universityProgram ? `(${student.universityProgram})` : ''}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-1">
                                      <div>
                                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-wider">Gender</p>
                                        <p className="font-bold text-slate-800">{student.gender}</p>
                                      </div>
                                      <div>
                                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-wider">Academic Session</p>
                                        <p className="font-bold text-slate-800">2025/2026</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Footer Panel */}
                                <div className="px-4 py-2 border-t border-slate-100 flex items-center justify-between bg-slate-50">
                                  {/* Signature section */}
                                  <div className="space-y-0.5">
                                    <div className="h-3.5 border-b border-slate-400/85 w-20 relative">
                                      <span className="absolute bottom-0 left-1 font-serif text-[7px] italic text-indigo-700 font-semibold select-none leading-none">{SCHOOL_INFO.principalSignature || SCHOOL_INFO.principalName}</span>
                                    </div>
                                    <p className="text-[6px] text-slate-400 font-semibold uppercase tracking-wider">Principal / Registrar</p>
                                  </div>

                                  <div className="flex items-center gap-1.5 font-black text-[7px] tracking-wide text-indigo-700 uppercase bg-indigo-50 border border-indigo-100/50 rounded-sm px-1 py-0.5">
                                    <ShieldCheck className="w-3 h-3" /> OFFICIAL STUDENT PASS
                                  </div>

                                  {/* Elegant Vector QR code */}
                                  <div className="shrink-0">
                                    <svg className="w-8 h-8 text-slate-900 bg-white p-0.5 border border-slate-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                      <rect x="1" y="1" width="6" height="6" rx="0.5" strokeWidth="2" />
                                      <rect x="3" y="3" width="2" height="2" fill="currentColor" />
                                      <rect x="17" y="1" width="6" height="6" rx="0.5" strokeWidth="2" />
                                      <rect x="19" y="3" width="2" height="2" fill="currentColor" />
                                      <rect x="1" y="17" width="6" height="6" rx="0.5" strokeWidth="2" />
                                      <rect x="3" y="19" width="2" height="2" fill="currentColor" />
                                      <path d="M9 1h2v2H9V1zm4 0h2v2h-2V1zm0 4h2v2h-2V5zM9 9h2v2H9V9zm4 0h2v2h-2V9zm4 0h2v2h-2V9zm-8 4h2v2H9v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zm-8 4h2v2H9v-2zm4 4h2v2h-2v-2zm4-4h2v2h-2v-2zm-4 4h2v2h-2v-2zm-4 0h2v2H9v-2z" fill="currentColor" />
                                    </svg>
                                  </div>
                                </div>
                              </>
                            ) : (
                              /* ==================== CARD BACK ==================== */
                              <>
                                {/* Top colored ribbon bar */}
                                <div className={`h-1 w-full ${style.stripBg}`}></div>

                                {/* Body back contents */}
                                <div className="p-4 flex-1 flex flex-col justify-between text-slate-700">
                                  {/* National Motto banner */}
                                  <div className="text-center">
                                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">SIERRA LEONE ACADEMIC PORTAL</p>
                                    <p className="text-[8px] font-extrabold text-slate-800 italic uppercase tracking-wider mt-0.5">" Unity - Freedom - Justice "</p>
                                  </div>

                                  {/* Rules and Guidelines */}
                                  <div className="space-y-1.5 my-2">
                                    <p className="text-[6px] text-slate-400 font-extrabold uppercase tracking-wider">Official Card Instructions</p>
                                    <ol className="list-decimal list-inside text-[7px] text-slate-500 space-y-0.5 leading-relaxed">
                                      <li>This official identification card is the exclusive property of {SCHOOL_INFO.name}.</li>
                                      <li>The student whose details appear on the front must display this card on school premises.</li>
                                      <li>If found, please return immediately to the administrative registrar at: {SCHOOL_INFO.address}.</li>
                                    </ol>
                                  </div>

                                  {/* Contact Emergency Row */}
                                  <div className="grid grid-cols-2 gap-2 border-t border-dashed border-slate-100 pt-2 text-[7px]">
                                    <div>
                                      <p className="font-extrabold text-slate-400 uppercase">Emergency Contact</p>
                                      <p className="font-bold text-slate-800 mt-0.5 truncate">{student.parentPhone} ({student.parentName})</p>
                                    </div>
                                    <div>
                                      <p className="font-extrabold text-slate-400 uppercase">Portal & Registrar</p>
                                      <p className="font-bold text-indigo-600 mt-0.5 truncate">{SCHOOL_INFO.phone}</p>
                                      <p className="text-[6px] text-slate-500 font-mono truncate">{SCHOOL_INFO.website}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Footer barcode pattern */}
                                <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex flex-col items-center justify-center">
                                  {/* Vector Barcode SVG */}
                                  <svg className="w-48 h-5 text-slate-800" viewBox="0 0 100 20" preserveAspectRatio="none">
                                    <rect x="0" y="0" width="2" height="20" fill="currentColor" />
                                    <rect x="4" y="0" width="1" height="20" fill="currentColor" />
                                    <rect x="7" y="0" width="3" height="20" fill="currentColor" />
                                    <rect x="12" y="0" width="1" height="20" fill="currentColor" />
                                    <rect x="15" y="0" width="2" height="20" fill="currentColor" />
                                    <rect x="19" y="0" width="4" height="20" fill="currentColor" />
                                    <rect x="25" y="0" width="1" height="20" fill="currentColor" />
                                    <rect x="28" y="0" width="2" height="20" fill="currentColor" />
                                    <rect x="32" y="0" width="3" height="20" fill="currentColor" />
                                    <rect x="37" y="0" width="1" height="20" fill="currentColor" />
                                    <rect x="40" y="0" width="2" height="20" fill="currentColor" />
                                    <rect x="44" y="0" width="1" height="20" fill="currentColor" />
                                    <rect x="47" y="0" width="4" height="20" fill="currentColor" />
                                    <rect x="53" y="0" width="2" height="20" fill="currentColor" />
                                    <rect x="57" y="0" width="1" height="20" fill="currentColor" />
                                    <rect x="60" y="0" width="3" height="20" fill="currentColor" />
                                    <rect x="65" y="0" width="1" height="20" fill="currentColor" />
                                    <rect x="68" y="0" width="2" height="20" fill="currentColor" />
                                    <rect x="72" y="0" width="4" height="20" fill="currentColor" />
                                    <rect x="78" y="0" width="1" height="20" fill="currentColor" />
                                    <rect x="81" y="0" width="2" height="20" fill="currentColor" />
                                    <rect x="85" y="0" width="3" height="20" fill="currentColor" />
                                    <rect x="90" y="0" width="1" height="20" fill="currentColor" />
                                    <rect x="93" y="0" width="2" height="20" fill="currentColor" />
                                    <rect x="97" y="0" width="3" height="20" fill="currentColor" />
                                  </svg>
                                  <p className="text-[6px] text-slate-400 font-semibold tracking-wider font-mono mt-1 uppercase">{student.id}</p>
                                </div>
                              </>
                            )}
                          </div>
                          
                          {/* Label below preview */}
                          <span className="text-[10px] text-slate-400 font-bold">{student.name} ({cardFace === 'front' ? 'Front Side' : 'Back Side'})</span>
                        </div>


                        {/* ==================== PRINT ONLY RENDERING (BOTH SIDES SHOWN SIDE-BY-SIDE!) ==================== */}
                        <div className="hidden print:flex print:flex-row print:gap-4 print:mb-8 print:break-inside-avoid">
                          {/* PRINT FRONT SIDE */}
                          <div 
                            className={`w-[340px] h-[215px] bg-white rounded-2xl border ${style.cardBorder} relative overflow-hidden flex flex-col justify-between shadow-none print:border print:border-slate-300`}
                          >
                            {/* National Flag Top Stripe */}
                            <div className="flex h-[3px] w-full overflow-hidden absolute top-0 left-0">
                              <div className="bg-[#10b981] w-1/3"></div>
                              <div className="bg-white w-1/3"></div>
                              <div className="bg-[#3b82f6] w-1/3"></div>
                            </div>

                            {/* Crest & Header Panel */}
                            <div className={`px-4 pt-3.5 pb-2.5 bg-gradient-to-r ${style.headerGradient} text-white flex items-center gap-2.5 border-b border-slate-100/10`}>
                              <img 
                                src={SCHOOL_INFO.logo} 
                                alt={`${SCHOOL_INFO.name} Logo`} 
                                className="w-7 h-7 rounded-lg bg-white object-contain p-0.5 shrink-0 border border-white/40"
                                referrerPolicy="no-referrer"
                              />
                              <div className="truncate">
                                <h3 className="font-black text-[10px] uppercase tracking-wide leading-tight">{SCHOOL_INFO.name}</h3>
                                <p className="text-[7px] text-indigo-200/80 font-bold uppercase tracking-widest mt-0.5">KAMBIA, SIERRA LEONE</p>
                              </div>
                            </div>

                            {/* Body Panel */}
                            <div className="p-4 flex-1 flex gap-4">
                              {/* Left: Avatar */}
                              <div className="w-[72px] h-[72px] shrink-0 relative">
                                {student.profileImage ? (
                                  <img 
                                    src={student.profileImage} 
                                    alt={student.name} 
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover rounded-xl border border-slate-200/80"
                                  />
                                ) : (
                                  <div className={`w-full h-full rounded-xl flex items-center justify-center font-black text-lg ${chosenStyle} border border-slate-200/40`}>
                                    {initials}
                                  </div>
                                )}
                                <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 border border-white flex items-center justify-center shadow-xs text-[6px] font-black text-amber-950 rotate-12">
                                  NS
                                </div>
                              </div>

                              {/* Right: Info rows */}
                              <div className="flex-1 min-w-0 text-[10px] space-y-1.5 text-slate-700">
                                <div>
                                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-wider">Student Name</p>
                                  <p className="font-extrabold text-slate-800 truncate text-[11px] leading-tight">{student.name}</p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-1">
                                  <div>
                                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-wider">Admission ID</p>
                                    <p className="font-black text-indigo-600 font-mono text-[9px]">{student.admissionNumber}</p>
                                  </div>
                                  <div>
                                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-wider">
                                      {student.universityProgram ? 'Program / Year' : 'Grade / Class'}
                                    </p>
                                    <p className="font-extrabold text-slate-800 truncate">
                                      {student.currentClass} {student.universityProgram ? `(${student.universityProgram})` : ''}
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-1">
                                  <div>
                                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-wider">Gender</p>
                                    <p className="font-bold text-slate-800">{student.gender}</p>
                                  </div>
                                  <div>
                                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-wider">Academic Session</p>
                                    <p className="font-bold text-slate-800">2025/2026</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Footer Panel */}
                            <div className="px-4 py-2 border-t border-slate-100 flex items-center justify-between bg-slate-50">
                              {/* Signature section */}
                              <div className="space-y-0.5">
                                <div className="h-3.5 border-b border-slate-400/85 w-20 relative">
                                  <span className="absolute bottom-0 left-1 font-serif text-[7px] italic text-indigo-700 font-semibold select-none leading-none">{SCHOOL_INFO.principalSignature || SCHOOL_INFO.principalName}</span>
                                </div>
                                <p className="text-[6px] text-slate-400 font-semibold uppercase tracking-wider">Principal / Registrar</p>
                              </div>

                              <div className="flex items-center gap-1.5 font-black text-[7px] tracking-wide text-indigo-700 uppercase bg-indigo-50 border border-indigo-100/50 rounded-sm px-1 py-0.5">
                                <ShieldCheck className="w-3 h-3" /> OFFICIAL STUDENT PASS
                              </div>

                              {/* Vector QR code */}
                              <div className="shrink-0">
                                <svg className="w-8 h-8 text-slate-900 bg-white p-0.5 border border-slate-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                  <rect x="1" y="1" width="6" height="6" rx="0.5" strokeWidth="2" />
                                  <rect x="3" y="3" width="2" height="2" fill="currentColor" />
                                  <rect x="17" y="1" width="6" height="6" rx="0.5" strokeWidth="2" />
                                  <rect x="19" y="3" width="2" height="2" fill="currentColor" />
                                  <rect x="1" y="17" width="6" height="6" rx="0.5" strokeWidth="2" />
                                  <rect x="3" y="19" width="2" height="2" fill="currentColor" />
                                  <path d="M9 1h2v2H9V1zm4 0h2v2h-2V1zm0 4h2v2h-2V5zM9 9h2v2H9V9zm4 0h2v2h-2V9zm4 0h2v2h-2V9zm-8 4h2v2H9v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zm-8 4h2v2H9v-2zm4 4h2v2h-2v-2zm4-4h2v2h-2v-2zm-4 4h2v2h-2v-2zm-4 0h2v2H9v-2z" fill="currentColor" />
                                </svg>
                              </div>
                            </div>
                          </div>

                          {/* PRINT BACK SIDE */}
                          <div 
                            className="w-[340px] h-[215px] bg-white rounded-2xl border relative overflow-hidden flex flex-col justify-between shadow-none print:border print:border-slate-300"
                          >
                            {/* Top colored ribbon bar */}
                            <div className={`h-1 w-full ${style.stripBg}`}></div>

                            {/* Body back contents */}
                            <div className="p-4 flex-1 flex flex-col justify-between text-slate-700">
                              {/* National Motto banner */}
                              <div className="text-center">
                                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">SIERRA LEONE ACADEMIC PORTAL</p>
                                <p className="text-[8px] font-extrabold text-slate-800 italic uppercase tracking-wider mt-0.5">" Unity - Freedom - Justice "</p>
                              </div>

                              {/* Rules and Guidelines */}
                              <div className="space-y-1.5 my-2">
                                <p className="text-[6px] text-slate-400 font-extrabold uppercase tracking-wider">Official Card Instructions</p>
                                <ol className="list-decimal list-inside text-[7px] text-slate-500 space-y-0.5 leading-relaxed">
                                  <li>This official identification card is the exclusive property of {SCHOOL_INFO.name}.</li>
                                  <li>The student whose details appear on the front must display this card on school premises.</li>
                                  <li>If found, please return immediately to the administrative registrar at: {SCHOOL_INFO.address}.</li>
                                </ol>
                              </div>

                              {/* Contact Emergency Row */}
                              <div className="grid grid-cols-2 gap-2 border-t border-dashed border-slate-100 pt-2 text-[7px]">
                                <div>
                                  <p className="font-extrabold text-slate-400 uppercase">Emergency Contact</p>
                                  <p className="font-bold text-slate-800 mt-0.5 truncate">{student.parentPhone} ({student.parentName})</p>
                                </div>
                                <div>
                                  <p className="font-extrabold text-slate-400 uppercase">Portal & Registrar</p>
                                  <p className="font-bold text-indigo-600 mt-0.5 truncate">{SCHOOL_INFO.phone}</p>
                                  <p className="text-[6px] text-slate-500 font-mono truncate">{SCHOOL_INFO.website}</p>
                                </div>
                              </div>
                            </div>

                            {/* Footer barcode pattern */}
                            <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex flex-col items-center justify-center">
                              {/* Vector Barcode SVG */}
                              <svg className="w-48 h-5 text-slate-800" viewBox="0 0 100 20" preserveAspectRatio="none">
                                <rect x="0" y="0" width="2" height="20" fill="currentColor" />
                                <rect x="4" y="0" width="1" height="20" fill="currentColor" />
                                <rect x="7" y="0" width="3" height="20" fill="currentColor" />
                                <rect x="12" y="0" width="1" height="20" fill="currentColor" />
                                <rect x="15" y="0" width="2" height="20" fill="currentColor" />
                                <rect x="19" y="0" width="4" height="20" fill="currentColor" />
                                <rect x="25" y="0" width="1" height="20" fill="currentColor" />
                                <rect x="28" y="0" width="2" height="20" fill="currentColor" />
                                <rect x="32" y="0" width="3" height="20" fill="currentColor" />
                                <rect x="37" y="0" width="1" height="20" fill="currentColor" />
                                <rect x="40" y="0" width="2" height="20" fill="currentColor" />
                                <rect x="44" y="0" width="1" height="20" fill="currentColor" />
                                <rect x="47" y="0" width="4" height="20" fill="currentColor" />
                                <rect x="53" y="0" width="2" height="20" fill="currentColor" />
                                <rect x="57" y="0" width="1" height="20" fill="currentColor" />
                                <rect x="60" y="0" width="3" height="20" fill="currentColor" />
                                <rect x="65" y="0" width="1" height="20" fill="currentColor" />
                                <rect x="68" y="0" width="2" height="20" fill="currentColor" />
                                <rect x="72" y="0" width="4" height="20" fill="currentColor" />
                                <rect x="78" y="0" width="1" height="20" fill="currentColor" />
                                <rect x="81" y="0" width="2" height="20" fill="currentColor" />
                                <rect x="85" y="0" width="3" height="20" fill="currentColor" />
                                <rect x="90" y="0" width="1" height="20" fill="currentColor" />
                                <rect x="93" y="0" width="2" height="20" fill="currentColor" />
                                <rect x="97" y="0" width="3" height="20" fill="currentColor" />
                              </svg>
                              <p className="text-[6px] text-slate-400 font-semibold tracking-wider font-mono mt-1 uppercase">{student.id}</p>
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
