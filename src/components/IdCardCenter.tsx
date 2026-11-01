/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { 
  CreditCard, 
  Search, 
  Printer, 
  Copy, 
  Check, 
  Filter, 
  Users, 
  UserCheck, 
  Award, 
  ShieldCheck, 
  QrCode, 
  Barcode, 
  RotateCw, 
  CheckSquare, 
  Square, 
  Download, 
  Eye, 
  Phone, 
  MapPin, 
  Calendar, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  GraduationCap,
  Briefcase
} from 'lucide-react';
import { Student, Teacher, StudentClass } from '../types';
import { SCHOOL_INFO, DEFAULT_SAMPLE_TEACHERS } from '../initialData';
import { CLASSES_LIST } from '../constants';

interface IdCardCenterProps {
  students: Student[];
  onNavigate?: (tab: string, args?: any) => void;
  initialSelection?: {
    type?: 'student' | 'staff';
    id?: string;
  };
}

type CardType = 'student' | 'staff';
type CardOrientation = 'portrait' | 'landscape';
type CardFace = 'front' | 'back' | 'both';
type CardColorTheme = 'navy' | 'emerald' | 'maroon' | 'carbon';

export default function IdCardCenter({ students, onNavigate, initialSelection }: IdCardCenterProps) {
  // Registry type: Student IDs vs Staff IDs
  const [activeCardType, setActiveCardType] = useState<CardType>(initialSelection?.type || 'student');
  
  // Teachers data loaded from localStorage or defaults
  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const cached = localStorage.getItem('sma_teachers');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return [];
      }
    }
    return [];
  });

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  // Preview & Print customization states
  const [orientation, setOrientation] = useState<CardOrientation>('portrait');
  const [faceView, setFaceView] = useState<CardFace>('both');
  const [theme, setTheme] = useState<CardColorTheme>('navy');

  // Selected candidates for batch printing
  const [selectedStudentIds, setSelectedStudentIds] = useState<Record<string, boolean>>({});
  const [selectedStaffIds, setSelectedStaffIds] = useState<Record<string, boolean>>({});

  // Active single preview candidate
  const [focusedCandidateId, setFocusedCandidateId] = useState<string | null>(initialSelection?.id || null);

  // Copied feedback toast state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync initial student or teacher if passed
  React.useEffect(() => {
    if (initialSelection?.type === 'staff') {
      setActiveCardType('staff');
      if (initialSelection.id) {
        setFocusedCandidateId(initialSelection.id);
        setSelectedStaffIds({ [initialSelection.id]: true });
      }
    } else if (initialSelection?.type === 'student' || initialSelection?.id) {
      setActiveCardType('student');
      if (initialSelection?.id) {
        setFocusedCandidateId(initialSelection.id);
        setSelectedStudentIds({ [initialSelection.id]: true });
      }
    }
  }, [initialSelection]);

  // Set default selection when switching types if empty
  React.useEffect(() => {
    if (activeCardType === 'student') {
      if (!focusedCandidateId && students.length > 0) {
        const first = students[0];
        setFocusedCandidateId(first.id);
        setSelectedStudentIds({ [first.id]: true });
      }
    } else {
      if (!focusedCandidateId && teachers.length > 0) {
        const first = teachers[0];
        setFocusedCandidateId(first.id);
        setSelectedStaffIds({ [first.id]: true });
      }
    }
  }, [activeCardType, students, teachers]);

  // Copy ID helper
  const handleCopyId = (idNumber: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(idNumber);
    setCopiedId(idNumber);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = 
        (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.admissionNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.currentClass || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesTier = true;
      const c = s.currentClass || '';
      if (tierFilter !== 'All') {
        if (tierFilter === 'Pre-School') matchesTier = c.startsWith('Pre');
        else if (tierFilter === 'Nursery') matchesTier = c.startsWith('Nursery') || c.startsWith('Prep');
        else if (tierFilter === 'Primary') matchesTier = c.startsWith('Class');
        else if (tierFilter === 'JSS') matchesTier = c.startsWith('JSS');
        else if (tierFilter === 'SSS') matchesTier = c.startsWith('SSS');
        else if (tierFilter === 'University') matchesTier = c.startsWith('University');
        else matchesTier = c === tierFilter;
      }

      return matchesSearch && matchesTier;
    });
  }, [students, searchQuery, tierFilter]);

  // Filtered teachers / staff
  const filteredStaff = useMemo(() => {
    return teachers.filter(t => {
      const staffId = t.staffId || `STF-${t.id.replace('t-', '00')}`;
      const matchesSearch = 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staffId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.department && t.department.toLowerCase().includes(searchQuery.toLowerCase()));
      
      let matchesDept = true;
      if (departmentFilter !== 'All') {
        matchesDept = t.department === departmentFilter;
      }

      return matchesSearch && matchesDept;
    });
  }, [teachers, searchQuery, departmentFilter]);

  // Selection toggle helpers
  const toggleStudent = (id: string) => {
    setSelectedStudentIds(prev => ({ ...prev, [id]: !prev[id] }));
    setFocusedCandidateId(id);
  };

  const toggleStaff = (id: string) => {
    setSelectedStaffIds(prev => ({ ...prev, [id]: !prev[id] }));
    setFocusedCandidateId(id);
  };

  const selectAllVisible = () => {
    if (activeCardType === 'student') {
      const allSelected = filteredStudents.every(s => selectedStudentIds[s.id]);
      const next: Record<string, boolean> = { ...selectedStudentIds };
      filteredStudents.forEach(s => { next[s.id] = !allSelected; });
      setSelectedStudentIds(next);
    } else {
      const allSelected = filteredStaff.every(t => selectedStaffIds[t.id]);
      const next: Record<string, boolean> = { ...selectedStaffIds };
      filteredStaff.forEach(t => { next[t.id] = !allSelected; });
      setSelectedStaffIds(next);
    }
  };

  // Selected lists for print
  const selectedStudentsForPrint = useMemo(() => {
    return students.filter(s => selectedStudentIds[s.id]);
  }, [students, selectedStudentIds]);

  const selectedStaffForPrint = useMemo(() => {
    return teachers.filter(t => selectedStaffIds[t.id]);
  }, [teachers, selectedStaffIds]);

  // Current active candidate to preview
  const focusedStudent = useMemo(() => {
    return students.find(s => s.id === focusedCandidateId) || students[0] || null;
  }, [students, focusedCandidateId]);

  const focusedStaff = useMemo(() => {
    return teachers.find(t => t.id === focusedCandidateId) || teachers[0] || null;
  }, [teachers, focusedCandidateId]);

  // Theme palettes
  const themeConfig = {
    navy: {
      accent: 'from-slate-950 via-indigo-950 to-slate-900',
      headerBg: 'bg-slate-900',
      headerBorder: 'border-amber-400',
      ribbonText: 'text-amber-300',
      badgeBg: 'bg-amber-400/20 text-amber-300 border-amber-400/30',
      idBadgeBg: 'bg-indigo-950/80 border-indigo-500/40 text-indigo-200',
      stripBg: 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600',
      outerBorder: 'border-slate-800',
      glow: 'shadow-indigo-950/40',
      textColor: 'text-white',
      mutedText: 'text-slate-300'
    },
    emerald: {
      accent: 'from-emerald-950 via-teal-950 to-slate-950',
      headerBg: 'bg-emerald-950',
      headerBorder: 'border-emerald-400',
      ribbonText: 'text-emerald-300',
      badgeBg: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30',
      idBadgeBg: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200',
      stripBg: 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600',
      outerBorder: 'border-emerald-900',
      glow: 'shadow-emerald-950/40',
      textColor: 'text-white',
      mutedText: 'text-emerald-200'
    },
    maroon: {
      accent: 'from-rose-950 via-purple-950 to-slate-950',
      headerBg: 'bg-rose-950',
      headerBorder: 'border-rose-400',
      ribbonText: 'text-rose-300',
      badgeBg: 'bg-rose-400/20 text-rose-300 border-rose-400/30',
      idBadgeBg: 'bg-rose-950/80 border-rose-500/40 text-rose-200',
      stripBg: 'bg-gradient-to-r from-rose-500 via-amber-400 to-rose-600',
      outerBorder: 'border-rose-900',
      glow: 'shadow-rose-950/40',
      textColor: 'text-white',
      mutedText: 'text-rose-200'
    },
    carbon: {
      accent: 'from-slate-900 via-zinc-900 to-neutral-950',
      headerBg: 'bg-zinc-900',
      headerBorder: 'border-slate-400',
      ribbonText: 'text-slate-200',
      badgeBg: 'bg-slate-500/20 text-slate-200 border-slate-400/30',
      idBadgeBg: 'bg-zinc-950/80 border-slate-600 text-slate-200',
      stripBg: 'bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400',
      outerBorder: 'border-zinc-800',
      glow: 'shadow-slate-950/40',
      textColor: 'text-white',
      mutedText: 'text-slate-300'
    }
  };

  const currentTheme = themeConfig[theme];

  // Print Action
  const handlePrint = () => {
    window.print();
  };

  // Helper barcode generator (SVG bars)
  const renderSvgBarcode = (idString: string, height: number = 32) => {
    // Generate deterministic pattern based on characters
    const bars: boolean[] = [];
    // Start guard
    bars.push(true, false, true);
    for (let i = 0; i < idString.length; i++) {
      const code = idString.charCodeAt(i);
      for (let b = 0; b < 5; b++) {
        bars.push(((code >> b) & 1) === 1);
        bars.push(false);
      }
    }
    // Stop guard
    bars.push(true, false, true, true);

    return (
      <div className="flex flex-col items-center">
        <svg className="w-full" height={height} viewBox={`0 0 ${bars.length * 2} ${height}`} preserveAspectRatio="none">
          {bars.map((isBar, idx) => isBar ? (
            <rect key={idx} x={idx * 2} y={0} width={2} height={height} fill="#0f172a" />
          ) : null)}
        </svg>
        <span className="font-mono text-[9px] tracking-widest text-slate-700 font-bold mt-0.5 select-all">
          *{idString}*
        </span>
      </div>
    );
  };

  // Helper QR Code placeholder / SVG
  const renderSvgQr = (idString: string, name: string) => {
    return (
      <div className="p-1 bg-white border border-slate-200 rounded-lg shadow-2xs flex flex-col items-center justify-center shrink-0">
        <div className="w-14 h-14 bg-slate-900 p-1 rounded grid grid-cols-5 gap-0.5">
          {/* Simulated QR pattern squares */}
          <div className="col-span-2 row-span-2 bg-white rounded-xs p-0.5 flex items-center justify-center">
            <div className="w-2 h-2 bg-slate-900 rounded-2xs" />
          </div>
          <div className="bg-white" />
          <div className="col-span-2 row-span-2 bg-white rounded-xs p-0.5 flex items-center justify-center">
            <div className="w-2 h-2 bg-slate-900 rounded-2xs" />
          </div>
          <div className="bg-white" />
          <div className="col-span-2 row-span-2 bg-white rounded-xs p-0.5 flex items-center justify-center">
            <div className="w-2 h-2 bg-slate-900 rounded-2xs" />
          </div>
          <div className="bg-white" />
          <div className="bg-white" />
          <div className="bg-white" />
        </div>
        <span className="text-[7px] font-mono text-slate-500 font-bold mt-0.5">VERIFIED</span>
      </div>
    );
  };

  // Render Front Card Function
  const renderCardFront = (
    data: {
      type: 'student' | 'staff';
      name: string;
      idNumber: string;
      titleOrClass: string;
      departmentOrStream?: string;
      bloodType?: string;
      emergencyPhone?: string;
      photo?: string;
      status?: string;
      validUntil?: string;
    },
    isPrintGrid: boolean = false
  ) => {
    return (
      <div 
        className={`relative overflow-hidden rounded-2xl bg-white border ${currentTheme.outerBorder} shadow-xl flex flex-col justify-between transition-all ${
          orientation === 'portrait' ? 'w-[320px] h-[480px]' : 'w-[480px] h-[300px]'
        } ${isPrintGrid ? 'print:shadow-none print:border-slate-800' : ''}`}
        style={{ boxSizing: 'border-box' }}
      >
        {/* Sierra Leone National Colors Ribbon Accent Top */}
        <div className="h-2 w-full grid grid-cols-3 shrink-0">
          <div className="bg-emerald-500" />
          <div className="bg-white" />
          <div className="bg-sky-500" />
        </div>

        {/* Card Header */}
        <div className={`p-3.5 bg-gradient-to-r ${currentTheme.accent} text-white shrink-0 relative border-b border-amber-400/40`}>
          <div className="flex items-center gap-2.5">
            <img 
              src={SCHOOL_INFO.logo} 
              alt="Crest" 
              className="w-10 h-10 rounded-full object-contain p-0.5 border-2 border-amber-400/80 shadow-xs shrink-0 bg-white" 
            />
            <div className="min-w-0 flex-1">
              <h3 className="font-extrabold text-[12px] leading-tight tracking-wide text-white uppercase truncate">
                {SCHOOL_INFO.name}
              </h3>
              <p className="text-[9px] font-semibold text-amber-300 tracking-wider flex items-center gap-1">
                <span>{SCHOOL_INFO.motto}</span>
                <span>•</span>
                <span>KAMBIA, SIERRA LEONE</span>
              </p>
            </div>
            <div className="shrink-0 text-right">
              <span className="px-1.5 py-0.5 bg-amber-400 text-slate-950 font-black text-[9px] rounded uppercase tracking-wider">
                {data.type === 'student' ? 'STUDENT' : 'FACULTY'}
              </span>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-3.5 flex-1 flex flex-col justify-between relative bg-gradient-to-b from-slate-50/70 to-white">
          {/* Subtle Security Holographic Background Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none select-none">
            <ShieldCheck className="w-64 h-64 text-slate-900" />
          </div>

          <div className={`flex gap-3 relative z-10 ${orientation === 'portrait' ? 'items-center' : 'items-start'}`}>
            {/* Photo / Portrait */}
            <div className="relative shrink-0">
              <div className="w-20 h-24 rounded-xl border-2 border-slate-800/80 overflow-hidden bg-slate-100 shadow-md flex items-center justify-center">
                {data.photo ? (
                  <img src={data.photo} alt={data.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Users className="w-8 h-8 text-slate-400" />
                    <span className="text-[8px] font-bold mt-1 text-slate-400">OFFICIAL</span>
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 bg-emerald-600 text-white rounded-full p-0.5 border-2 border-white shadow-xs">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
            </div>

            {/* Candidate Details */}
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Full Legal Name</p>
              <h4 className="font-extrabold text-sm text-slate-900 leading-snug truncate">
                {data.name}
              </h4>

              <div className="mt-1.5 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-semibold text-slate-500 uppercase">
                    {data.type === 'student' ? 'Level / Class:' : 'Designation:'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-800 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                    {data.titleOrClass}
                  </span>
                </div>

                {data.departmentOrStream && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-semibold text-slate-500 uppercase">
                      {data.type === 'student' ? 'Stream:' : 'Dept:'}
                    </span>
                    <span className="text-[10px] font-semibold text-indigo-700 truncate max-w-[140px]">
                      {data.departmentOrStream}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-0.5 text-[9px] text-slate-500">
                  {data.bloodType && (
                    <span>Blood: <strong className="text-rose-600">{data.bloodType}</strong></span>
                  )}
                  {data.emergencyPhone && (
                    <span>Emrg: <strong className="text-slate-700">{data.emergencyPhone}</strong></span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Identification Number Monospace Banner */}
          <div className="my-2 p-2 bg-slate-900 text-amber-300 rounded-xl border border-amber-400/30 flex items-center justify-between shadow-2xs">
            <div className="min-w-0">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">
                {data.type === 'student' ? 'OFFICIAL ADMISSION / ID NO.' : 'OFFICIAL EMPLOYEE STAFF ID'}
              </span>
              <span className="font-mono text-sm font-black tracking-wider text-amber-300 select-all truncate block">
                {data.idNumber}
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => handleCopyId(data.idNumber, e)}
              className="px-2 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-[10px] font-black flex items-center gap-1 transition-colors cursor-pointer shrink-0 shadow-2xs print:hidden"
              title="Copy Identification Number"
            >
              {copiedId === data.idNumber ? (
                <>
                  <Check className="w-3 h-3 stroke-[3]" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" /> Copy ID
                </>
              )}
            </button>
          </div>

          {/* Barcode and QR Code Section */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
            <div className="flex-1 min-w-0">
              {renderSvgBarcode(data.idNumber, 26)}
            </div>
            {renderSvgQr(data.idNumber, data.name)}
          </div>
        </div>

        {/* Footer Ribbon with Principal Signature */}
        <div className="px-3.5 py-2 bg-slate-100 border-t border-slate-200/80 flex items-center justify-between text-[8px] text-slate-600 shrink-0">
          <div>
            <p className="font-bold text-slate-800">Academic Session: 2025/2026</p>
            <p className="text-slate-500 text-[7.5px]">Auth: MBSSE / WAEC Reg. Accredited</p>
          </div>
          <div className="text-right">
            <p className="font-script text-[11px] font-bold text-indigo-900 leading-none">
              {SCHOOL_INFO.principalSignature}
            </p>
            <p className="text-[7.5px] font-bold text-slate-500 uppercase tracking-tighter">
              {SCHOOL_INFO.principalTitle}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Render Back Card Function
  const renderCardBack = (
    data: {
      type: 'student' | 'staff';
      name: string;
      idNumber: string;
      emergencyPhone?: string;
    },
    isPrintGrid: boolean = false
  ) => {
    return (
      <div 
        className={`relative overflow-hidden rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-xl flex flex-col justify-between ${
          orientation === 'portrait' ? 'w-[320px] h-[480px]' : 'w-[480px] h-[300px]'
        } ${isPrintGrid ? 'print:shadow-none print:border-slate-800' : ''}`}
        style={{ boxSizing: 'border-box' }}
      >
        {/* Simulated Magnetic Stripe */}
        <div className="w-full h-9 bg-black border-y border-slate-800 shrink-0 mt-3" />

        {/* Back Card Guidelines and Terms */}
        <div className="p-4 flex-1 flex flex-col justify-between text-[8.5px] leading-relaxed text-slate-300">
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="font-bold text-amber-300 uppercase tracking-wider text-[9px]">
                Terms of Card Issuance & Governance
              </span>
              <span className="font-mono text-slate-400 text-[8px]">{data.idNumber}</span>
            </div>

            <p>
              1. This credential card is the legal property of <strong>{SCHOOL_INFO.name}</strong>. It is non-transferable and must be surrendered upon graduation, transfer, or termination.
            </p>
            <p>
              2. The bearer is authorized access to school campus facilities, digital library kiosks, laboratory examinations, and bus commuter services.
            </p>
            <p>
              3. If lost or misplaced, a replacement fee applies. Any person finding this card is requested to return it immediately to the Administrative Office.
            </p>
          </div>

          {/* Lost & Found Institutional Address Box */}
          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
            <p className="font-bold text-amber-300 text-[9px] flex items-center gap-1">
              <MapPin className="w-3 h-3 text-amber-400" /> Administrative Return Address:
            </p>
            <p className="text-slate-200">{SCHOOL_INFO.address}</p>
            <p className="text-slate-300 flex items-center gap-2">
              <span>Hotline: <strong>{SCHOOL_INFO.phone}</strong></span>
              <span>•</span>
              <span>Parent/Staff Helpline: <strong>+232 76 345678</strong></span>
            </p>
          </div>

          {/* Verification Barcode & Serial */}
          <div className="border-t border-slate-800 pt-2 flex items-center justify-between">
            <div>
              <span className="text-[7.5px] text-slate-400 block font-mono">SERIAL NO: GWM-SEC-2026-SL</span>
              <span className="text-[7.5px] text-emerald-400 font-bold block">✓ ENCRYPTED BIOMETRIC SECURE</span>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-bold text-amber-300 block">{SCHOOL_INFO.slogan}</span>
              <span className="text-[7px] text-slate-400">Founded {SCHOOL_INFO.founded}</span>
            </div>
          </div>
        </div>

        {/* Sierra Leone National Colors Bottom Ribbon */}
        <div className="h-1.5 w-full grid grid-cols-3 shrink-0">
          <div className="bg-emerald-500" />
          <div className="bg-white" />
          <div className="bg-sky-500" />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6" id="id-card-center-module">
      {/* Printable Sheet View - ONLY rendered when printing */}
      <div className="hidden print:block print:w-full print:bg-white print:p-0 print:m-0" id="print-sheet-container">
        <div className="text-center pb-4 border-b border-slate-300 mb-6">
          <h1 className="text-lg font-bold text-slate-900 uppercase tracking-wide">{SCHOOL_INFO.name}</h1>
          <p className="text-xs text-slate-600">Official Identification Badges Batch Print Sheet • Session 2025/2026</p>
        </div>

        <div className="grid grid-cols-2 gap-8 justify-items-center">
          {activeCardType === 'student' ? (
            selectedStudentsForPrint.map(student => (
              <React.Fragment key={student.id}>
                {renderCardFront({
                  type: 'student',
                  name: student.name,
                  idNumber: student.admissionNumber,
                  titleOrClass: student.currentClass,
                  departmentOrStream: student.stream,
                  bloodType: student.bloodType || 'O+',
                  emergencyPhone: student.emergencyContactPhone || student.parentPhone,
                  photo: student.profileImage
                }, true)}
                {faceView !== 'front' && renderCardBack({
                  type: 'student',
                  name: student.name,
                  idNumber: student.admissionNumber,
                  emergencyPhone: student.parentPhone
                }, true)}
              </React.Fragment>
            ))
          ) : (
            selectedStaffForPrint.map(staff => (
              <React.Fragment key={staff.id}>
                {renderCardFront({
                  type: 'staff',
                  name: staff.name,
                  idNumber: staff.staffId || `STF-${staff.id.replace('t-', '00')}`,
                  titleOrClass: staff.roleTitle || 'Faculty Member',
                  departmentOrStream: staff.department || 'Academic Instruction',
                  bloodType: staff.bloodType || 'A+',
                  emergencyPhone: staff.phone,
                  photo: staff.profileImage
                }, true)}
                {faceView !== 'front' && renderCardBack({
                  type: 'staff',
                  name: staff.name,
                  idNumber: staff.staffId || `STF-${staff.id.replace('t-', '00')}`,
                  emergencyPhone: staff.phone
                }, true)}
              </React.Fragment>
            ))
          )}
        </div>
      </div>

      {/* Screen Interface - Hidden during print */}
      <div className="print:hidden space-y-6">
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 font-extrabold text-[10px] tracking-wider uppercase flex items-center gap-1 shadow-2xs">
                <CreditCard className="w-3 h-3" /> Official Identity Authority
              </span>
              <span className="text-xs text-slate-400">• Standard CR80 Form Factor</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              ID Card Generator & Identification Hub
            </h1>
            <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              Find, verify, and print official security-watermarked identification cards and badges with scannable barcodes and QR codes for all students and academic staff.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer"
              id="print-badges-btn"
            >
              <Printer className="w-4 h-4" /> Print Selected Badges (
              {activeCardType === 'student' ? selectedStudentsForPrint.length : selectedStaffForPrint.length}
              )
            </button>
            {onNavigate && (
              <button
                onClick={() => onNavigate(activeCardType === 'student' ? 'students' : 'staff-management')}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all cursor-pointer"
              >
                Go to Directory <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Primary Layout: Left candidate selector + Right Card Preview & Customizer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT PANEL: Dual Candidate Selector (Cols 1 to 5) */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col h-[750px]">
            {/* Toggle Card Type Header */}
            <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-2">
              <div className="grid grid-cols-2 p-1 bg-slate-200/70 rounded-2xl w-full">
                <button
                  type="button"
                  onClick={() => {
                    setActiveCardType('student');
                    setSearchQuery('');
                  }}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    activeCardType === 'student'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" /> Student IDs ({students.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCardType('staff');
                    setSearchQuery('');
                  }}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    activeCardType === 'staff'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Briefcase className="w-4 h-4" /> Staff Badges ({teachers.length})
                </button>
              </div>
            </div>

            {/* Quick Search and Filter Bar */}
            <div className="p-4 border-b border-slate-100 space-y-2.5 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder={
                    activeCardType === 'student' 
                      ? "Search Admission ID (e.g., SMA-2026-0501) or Name..." 
                      : "Search Staff ID (e.g., STF-2021-001) or Name..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-800 placeholder-slate-400 font-medium transition-all"
                />
              </div>

              {activeCardType === 'student' ? (
                <div className="flex items-center gap-2">
                  <select
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="All">All Academic Tiers</option>
                    <option value="Pre-School">Pre-School (Pre 1 - 3)</option>
                    <option value="Nursery">Nursery / Prep (1 - 3)</option>
                    <option value="Primary">Primary (Class 1 - 6)</option>
                    <option value="JSS">Junior Secondary (JSS 1 - 3)</option>
                    <option value="SSS">Senior Secondary (SSS 1 - 3)</option>
                    <option value="University">University Degrees (Year 1 - 4)</option>
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="All">All Departments</option>
                    <option value="Department of Mathematics & Computing">Mathematics & Computing</option>
                    <option value="Department of English & Literature">English & Literature</option>
                    <option value="Department of Natural Sciences">Natural Sciences</option>
                    <option value="Department of Applied Physics">Applied Physics</option>
                  </select>
                </div>
              )}
            </div>

            {/* List Header with Batch Select Checkbox */}
            <div className="px-4 py-2 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <span>
                {activeCardType === 'student' 
                  ? `${filteredStudents.length} Students found` 
                  : `${filteredStaff.length} Staff members found`}
              </span>
              <button 
                type="button"
                onClick={selectAllVisible}
                className="text-indigo-600 hover:text-indigo-800 cursor-pointer font-extrabold"
              >
                Select / Deselect Visible
              </button>
            </div>

            {/* Candidate List Scroll View */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
              {activeCardType === 'student' ? (
                filteredStudents.length > 0 ? (
                  filteredStudents.map(student => {
                    const isSelected = !!selectedStudentIds[student.id];
                    const isFocused = focusedCandidateId === student.id;
                    return (
                      <div
                        key={student.id}
                        onClick={() => {
                          setFocusedCandidateId(student.id);
                          if (!selectedStudentIds[student.id]) {
                            setSelectedStudentIds(prev => ({ ...prev, [student.id]: true }));
                          }
                        }}
                        className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isFocused 
                            ? 'bg-indigo-50/70 border-indigo-200 shadow-2xs' 
                            : 'bg-white border-transparent hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStudent(student.id);
                            }}
                            className="text-slate-400 hover:text-indigo-600 p-0.5 cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4.5 h-4.5 text-indigo-600" />
                            ) : (
                              <Square className="w-4.5 h-4.5 text-slate-300" />
                            )}
                          </button>

                          <div className="w-8 h-8 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                            {student.profileImage ? (
                              <img src={student.profileImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Users className="w-4 h-4 text-slate-400" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-slate-900 truncate">{student.name}</h4>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                              <span className="font-semibold text-indigo-600">{student.currentClass}</span>
                              <span>•</span>
                              <span className="font-mono text-slate-600 font-bold">{student.admissionNumber}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => handleCopyId(student.admissionNumber, e)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                            title="Copy Admission ID"
                          >
                            {copiedId === student.admissionNumber ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-16 text-slate-400 text-xs">
                    No students match query "{searchQuery}"
                  </div>
                )
              ) : (
                filteredStaff.length > 0 ? (
                  filteredStaff.map(staff => {
                    const staffId = staff.staffId || `STF-${staff.id.replace('t-', '00')}`;
                    const isSelected = !!selectedStaffIds[staff.id];
                    const isFocused = focusedCandidateId === staff.id;
                    return (
                      <div
                        key={staff.id}
                        onClick={() => {
                          setFocusedCandidateId(staff.id);
                          if (!selectedStaffIds[staff.id]) {
                            setSelectedStaffIds(prev => ({ ...prev, [staff.id]: true }));
                          }
                        }}
                        className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isFocused 
                            ? 'bg-indigo-50/70 border-indigo-200 shadow-2xs' 
                            : 'bg-white border-transparent hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStaff(staff.id);
                            }}
                            className="text-slate-400 hover:text-indigo-600 p-0.5 cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4.5 h-4.5 text-indigo-600" />
                            ) : (
                              <Square className="w-4.5 h-4.5 text-slate-300" />
                            )}
                          </button>

                          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-black text-xs shrink-0 flex items-center justify-center">
                            {staff.name.charAt(0)}
                          </div>

                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-slate-900 truncate">{staff.name}</h4>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                              <span className="font-semibold text-indigo-600">{staff.roleTitle || 'Faculty'}</span>
                              <span>•</span>
                              <span className="font-mono text-slate-600 font-bold">{staffId}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => handleCopyId(staffId, e)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                            title="Copy Staff ID"
                          >
                            {copiedId === staffId ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-16 text-slate-400 text-xs">
                    No staff match query "{searchQuery}"
                  </div>
                )
              )}
            </div>

            {/* Selection Summary Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Ready for Print Batch:</span>
              <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-lg font-bold">
                {activeCardType === 'student' ? selectedStudentsForPrint.length : selectedStaffForPrint.length} Selected
              </span>
            </div>
          </div>

          {/* RIGHT PANEL: Live Card Preview & Customization Controls (Cols 6 to 12) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Customization Toolbar */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
              {/* Orientation & View Toggles */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Face:</span>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setFaceView('front')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      faceView === 'front' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    Front
                  </button>
                  <button
                    type="button"
                    onClick={() => setFaceView('back')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      faceView === 'back' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setFaceView('both')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      faceView === 'both' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    Side-by-Side
                  </button>
                </div>
              </div>

              {/* Theme Color Selector */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Palette:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTheme('navy')}
                    title="Diplomats Navy & Gold"
                    className={`w-6 h-6 rounded-full bg-slate-900 border-2 transition-transform cursor-pointer ${
                      theme === 'navy' ? 'border-amber-400 scale-110 shadow-xs' : 'border-transparent'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setTheme('emerald')}
                    title="Sierra Leone Emerald Green"
                    className={`w-6 h-6 rounded-full bg-emerald-800 border-2 transition-transform cursor-pointer ${
                      theme === 'emerald' ? 'border-emerald-400 scale-110 shadow-xs' : 'border-transparent'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setTheme('maroon')}
                    title="Royal Maroon"
                    className={`w-6 h-6 rounded-full bg-rose-900 border-2 transition-transform cursor-pointer ${
                      theme === 'maroon' ? 'border-rose-400 scale-110 shadow-xs' : 'border-transparent'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setTheme('carbon')}
                    title="Slate Platinum"
                    className={`w-6 h-6 rounded-full bg-zinc-800 border-2 transition-transform cursor-pointer ${
                      theme === 'carbon' ? 'border-slate-300 scale-110 shadow-xs' : 'border-transparent'
                    }`}
                  />
                </div>
              </div>

              {/* Print Button */}
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" /> Print Badges
              </button>
            </div>

            {/* Live Interactive Card Stage */}
            <div className="bg-slate-100/70 p-6 md:p-8 rounded-3xl border border-slate-200/80 flex flex-col items-center justify-center min-h-[540px] relative overflow-hidden">
              
              {/* Informative Header Badge */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="px-2.5 py-1 bg-white/90 backdrop-blur-xs text-slate-700 rounded-lg text-[10px] font-extrabold border border-slate-200/80 shadow-2xs">
                  {activeCardType === 'student' ? 'Student Credential Preview' : 'Faculty Credential Preview'}
                </span>
              </div>

              {/* Cards Stage Container */}
              <div className={`flex flex-wrap items-center justify-center gap-8 ${faceView === 'both' ? 'flex-row' : 'flex-col'}`}>
                {activeCardType === 'student' ? (
                  focusedStudent ? (
                    <>
                      {(faceView === 'front' || faceView === 'both') && (
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider mb-2">Front Side</p>
                          {renderCardFront({
                            type: 'student',
                            name: focusedStudent.name,
                            idNumber: focusedStudent.admissionNumber,
                            titleOrClass: focusedStudent.currentClass,
                            departmentOrStream: focusedStudent.stream,
                            bloodType: focusedStudent.bloodType || 'O+',
                            emergencyPhone: focusedStudent.emergencyContactPhone || focusedStudent.parentPhone,
                            photo: focusedStudent.profileImage
                          })}
                        </div>
                      )}

                      {(faceView === 'back' || faceView === 'both') && (
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider mb-2">Reverse Side</p>
                          {renderCardBack({
                            type: 'student',
                            name: focusedStudent.name,
                            idNumber: focusedStudent.admissionNumber,
                            emergencyPhone: focusedStudent.parentPhone
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-slate-400 text-xs italic">Select a student from the list to preview</p>
                  )
                ) : (
                  focusedStaff ? (
                    <>
                      {(faceView === 'front' || faceView === 'both') && (
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider mb-2">Front Side</p>
                          {renderCardFront({
                            type: 'staff',
                            name: focusedStaff.name,
                            idNumber: focusedStaff.staffId || `STF-${focusedStaff.id.replace('t-', '00')}`,
                            titleOrClass: focusedStaff.roleTitle || 'Faculty Member',
                            departmentOrStream: focusedStaff.department || 'Academic Instruction',
                            bloodType: focusedStaff.bloodType || 'A+',
                            emergencyPhone: focusedStaff.phone,
                            photo: focusedStaff.profileImage
                          })}
                        </div>
                      )}

                      {(faceView === 'back' || faceView === 'both') && (
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider mb-2">Reverse Side</p>
                          {renderCardBack({
                            type: 'staff',
                            name: focusedStaff.name,
                            idNumber: focusedStaff.staffId || `STF-${focusedStaff.id.replace('t-', '00')}`,
                            emergencyPhone: focusedStaff.phone
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-slate-400 text-xs italic">Select a staff member from the list to preview</p>
                  )
                )}
              </div>
            </div>

            {/* Fast Tips Card */}
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3 shadow-2xs">
              <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h5 className="font-black text-amber-950">Identification Numbers & Print Standards</h5>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  Each student's official <strong>Admission Number</strong> (e.g. <span className="font-mono font-bold">SMA-2023-0142</span>) and staff <strong>Employee Code</strong> (e.g. <span className="font-mono font-bold">STF-2021-001</span>) is encoded in high-contrast Code 128 barcodes compatible with optical scanners at the school gate, library turnstiles, and bus drop-off manifests.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
