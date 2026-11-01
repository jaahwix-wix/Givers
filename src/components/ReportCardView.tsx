/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  Printer, 
  ChevronLeft, 
  Award, 
  Calendar, 
  MapPin, 
  Phone, 
  Signature, 
  FileCheck,
  CheckSquare,
  Globe
} from 'lucide-react';
import { Student, StudentAcademicRecord, StudentClass } from '../types';
import { SCHOOL_INFO } from '../initialData';
import { getGradingScale } from '../constants';

interface ReportCardViewProps {
  students: Student[];
  records: StudentAcademicRecord[];
  onNavigateBack: () => void;
  initialStudentId?: string;
}

export default function ReportCardView({ students, records, onNavigateBack, initialStudentId }: ReportCardViewProps) {
  
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId || (students[0]?.id || ''));
  const [selectedTerm, setSelectedTerm] = useState<1 | 2 | 3>(3); // default to final Term 3

  const student = students.find(s => s.id === selectedStudentId);
  const record = records.find(r => r.studentId === selectedStudentId);

  // Print helper
  const handlePrint = () => {
    window.print();
  };

  if (!student || !record) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-100">
        <p className="text-sm font-semibold text-slate-500">No active student or report file found.</p>
        <button onClick={onNavigateBack} className="mt-4 text-indigo-600 hover:underline font-semibold">
          Go Back
        </button>
      </div>
    );
  }

  const termData = record?.terms?.[selectedTerm];
  const grades = termData?.grades || [];

  // Metrics
  const subjectsCount = grades.length;
  const totalScoreSum = grades.reduce((sum, g) => sum + g.totalScore, 0);
  const averageScore = subjectsCount > 0 ? Math.round(totalScoreSum / subjectsCount) : 0;
  
  // Attendance metrics
  const attendancePresent = termData?.attendance?.presentDays || 0;
  const attendanceTotal = termData?.attendance?.totalDays || 0;
  const attendancePercentage = attendanceTotal > 0 ? Math.round((attendancePresent / attendanceTotal) * 100) : 0;

  // Promotion/Pass Decision
  let verdict = 'Promoted';
  let verdictColor = 'text-indigo-700 bg-indigo-50 border-indigo-200';
  if (selectedTerm === 3) {
    if (averageScore < 45) {
      verdict = 'Held Over / Retained';
      verdictColor = 'text-rose-700 bg-rose-50 border-rose-200';
    } else if (averageScore < 55) {
      verdict = 'Promoted on Probation';
      verdictColor = 'text-amber-700 bg-amber-50 border-amber-200';
    }
  }

  return (
    <div className="space-y-6" id="report-card-portal">
      
      {/* Top Controller Bar - Hidden when printing */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <button 
            onClick={onNavigateBack}
            className="p-2 hover:bg-slate-50 rounded-xl border border-slate-200 text-slate-600 transition-colors cursor-pointer"
            title="Go Back"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-bold text-slate-800">Student Terminal Report Card</h2>
            <p className="text-xs text-slate-400">View and print official terminal performance records</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Select Student */}
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            {students.filter(s => s.status === 'Active').map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.currentClass})</option>
            ))}
          </select>

          {/* Select Term */}
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(parseInt(e.target.value) as any)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="1">Term 1 Record</option>
            <option value="2">Term 2 Record</option>
            <option value="3">Term 3 Record (Final)</option>
          </select>

          <button 
            onClick={handlePrint}
            className="flex items-center gap-1.5 py-1.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Official Printable Report Card Template Container */}
      <div 
        className="bg-white border-2 border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-md max-w-4xl mx-auto print:border-none print:shadow-none print:p-0"
        id="printable-report-container"
      >
        {/* Sierra Leone National Colors ribbon */}
        <div className="flex h-1.5 w-full overflow-hidden rounded-full">
          <div className="bg-emerald-500 w-1/3"></div>
          <div className="bg-white w-1/3 border-y border-slate-100"></div>
          <div className="bg-blue-500 w-1/3"></div>
        </div>

        {/* Report Card Header */}
        <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left border-b-2 border-slate-800 pb-5 gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            {/* Official School Crest Logo */}
            <img 
              src={SCHOOL_INFO.logo} 
              alt={`${SCHOOL_INFO.name} Crest`} 
              className="w-16 h-16 md:w-20 md:h-20 object-contain bg-white rounded-xl border border-slate-200 p-1 shadow-sm shrink-0"
              referrerPolicy="no-referrer"
            />
            
            <div className="space-y-1">
              <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight font-sans uppercase">{SCHOOL_INFO.name}</h1>
              <p className="text-[11px] font-bold text-indigo-600 italic">" {SCHOOL_INFO.motto} "</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-x-4 text-[10px] text-slate-500 font-medium">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {SCHOOL_INFO.address}</span>
                <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {SCHOOL_INFO.phone}</span>
                <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {SCHOOL_INFO.website}</span>
              </div>
            </div>
          </div>

          <div className="text-center md:text-right md:shrink-0">
            <span className="inline-block px-3 py-1 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-md border border-slate-900">
              Official Academic Report
            </span>
            <p className="text-xs font-bold text-slate-700 mt-2">Academic Year: {record.academicYear}</p>
            <p className="text-xs font-bold text-indigo-600 mt-0.5">Term {selectedTerm} Terminal Assessment</p>
          </div>
        </div>

        {/* Student Profile Segment */}
        <div className="flex flex-col sm:flex-row gap-5 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 text-xs font-medium text-slate-600">
          {student.profileImage && (
            <div className="shrink-0 flex justify-center items-center">
              <img
                src={student.profileImage}
                alt={student.name}
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-xl object-cover border border-slate-300 shadow-sm"
              />
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
            <div className="space-y-1">
              <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Student Name</p>
              <p className="font-bold text-slate-800 text-sm truncate">{student.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Admission ID</p>
              <p className="font-bold text-slate-800 font-mono">{student.admissionNumber}</p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Current Grade/Class</p>
              <p className="font-bold text-slate-800">
                {student.currentClass}
                {student.universityProgram ? ` (${student.universityProgram} Program)` : ''}
                {student.stream && !student.universityProgram ? ` (${student.stream} Stream)` : ''}
                {student.classSection ? ` - ${student.classSection}` : ''}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Student Gender</p>
              <p className="font-bold text-slate-800">{student.gender === 'Male' ? 'Boy' : 'Girl'}</p>
            </div>

            <div className="space-y-1">
              <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Date of Birth</p>
              <p className="font-bold text-slate-800">{student.dateOfBirth}</p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Parent / Guardian</p>
              <p className="font-bold text-slate-800">{student.parentName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Guardian Phone</p>
              <p className="font-bold text-slate-800 font-mono">{student.parentPhone}</p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Term Enrollment Status</p>
              <span className="inline-flex items-center gap-1 text-[10px] text-indigo-700 font-bold bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 mt-0.5">
                Active Registry
              </span>
            </div>
          </div>
        </div>

        {/* Academic Marks Ledger */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest border-l-4 border-slate-900 pl-2">
            SUBJECT-WISE PERFORMANCE MATRIX
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-800 text-slate-500 font-black uppercase tracking-wider">
                  <th className="py-2">Subject Name</th>
                  <th className="py-2 text-center">Continuous Assessment ({student.currentClass.startsWith('Class') || student.currentClass.startsWith('Prep') ? '40' : '30'} marks)</th>
                  <th className="py-2 text-center">Terminal Exam ({student.currentClass.startsWith('Class') || student.currentClass.startsWith('Prep') ? '60' : '70'} marks)</th>
                  <th className="py-2 text-center">Total Score (100)</th>
                  <th className="py-2 text-center">Grade</th>
                  <th className="py-2 text-right">Teacher Verdict / Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {grades.map((g) => {
                  return (
                    <tr key={g.subject}>
                      <td className="py-2.5 font-bold text-slate-800">{g.subject}</td>
                      <td className="py-2.5 text-center font-mono">{g.caScore}</td>
                      <td className="py-2.5 text-center font-mono">{g.examScore}</td>
                      <td className="py-2.5 text-center font-black font-mono">{g.totalScore}</td>
                      <td className="py-2.5 text-center">
                        <span className="font-bold font-mono border border-slate-300 px-1.5 py-0.5 rounded">
                          {g.grade}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-[10px] text-slate-500 italic font-medium">{g.remark}</td>
                    </tr>
                  );
                })}
                {grades.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                      No terminal grade files entered for Term {selectedTerm}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Terminal Aggregates & Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t-2 border-slate-800 pt-5">
          
          {/* Left Block: Summary Statistics */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Performance Analytics Summary</h4>
            <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-center">
                <span className="text-[10px] text-slate-400 font-medium">Term Average</span>
                <span className="text-xl font-black text-slate-800 mt-1">{averageScore}%</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-center">
                <span className="text-[10px] text-slate-400 font-medium">Attendance Rate</span>
                <span className="text-xl font-black text-slate-800 mt-1">{attendancePercentage}% <span className="text-[10px] text-slate-400 font-normal">({attendancePresent}/{attendanceTotal} days)</span></span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-center col-span-2">
                <span className="text-[10px] text-slate-400 font-medium">Conduct & Deportment Rating</span>
                <span className="text-sm font-black text-slate-800 mt-1 flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-indigo-500" /> {termData?.conduct || 'Excellent'}
                </span>
              </div>
            </div>

            {/* If Term 3, display promotion verdict */}
            {selectedTerm === 3 && (
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${verdictColor}`}>
                <div>
                  <span className="text-[9px] uppercase font-black tracking-widest opacity-80">Next Session Status</span>
                  <p className="text-sm font-black mt-0.5">{verdict}</p>
                </div>
                <FileCheck className="w-6 h-6 opacity-75 shrink-0" />
              </div>
            )}
          </div>

          {/* Right Block: Official Evaluation Comments */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Formal Educator Assessment</h4>
            <div className="space-y-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Class Teacher's Assessment</span>
                <p className="p-3 bg-slate-50/50 rounded-xl border border-slate-200/50 italic leading-relaxed text-slate-700">
                  "{termData?.teacherRemarks || 'Continuous diligent focus on basic reading skills recommended.'}"
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Principal's Board Evaluation</span>
                <p className="p-3 bg-slate-50/50 rounded-xl border border-slate-200/50 italic leading-relaxed text-slate-700">
                  "{termData?.principalRemarks || 'Good academic standing. Keep up the excellent performance.'}"
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Grading Scale Guide & Legal Signature Stamp Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5 border-t border-slate-100 text-[10px] text-slate-500 font-medium">
          {/* Grading Legend */}
          <div>
            <p className="font-bold text-slate-700 uppercase tracking-wider mb-2">Grading Legend Guide</p>
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              {getGradingScale(student.currentClass).map(scale => (
                <span key={scale.grade} className="px-1.5 py-0.5 border border-slate-200 rounded font-mono">
                  <span className="font-bold text-slate-700">{scale.grade}</span> ({scale.minScore}+) {scale.remark}
                </span>
              ))}
            </div>
            <p className="mt-2 text-[9px] text-slate-400">
              * Official national education criteria: WAEC (BECE/WASSCE) rules applied for secondary levels. Prep & primary rules apply elsewhere.
            </p>
          </div>

          {/* Signatures */}
          <div className="flex justify-between items-end pt-4">
            <div className="text-center w-1/2">
              <div className="h-8 border-b border-slate-400/80 w-32 mx-auto"></div>
              <p className="mt-1 font-semibold text-slate-600">Class Teacher</p>
              <p className="text-[8px] text-slate-400">{SCHOOL_INFO.name}</p>
            </div>
            <div className="text-center w-1/2 relative">
              {/* Virtual stamp placeholder */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full border-2 border-indigo-500/30 flex items-center justify-center rotate-12 text-[8px] text-indigo-500/40 font-black pointer-events-none uppercase">
                GWM Stamp
              </div>
              <div className="h-8 border-b border-slate-400/80 w-32 mx-auto"></div>
              <p className="mt-1 font-bold text-slate-700">{SCHOOL_INFO.principalName}</p>
              <p className="text-[8px] text-slate-400">Principal / Registrar</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
