/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Award, 
  Edit3, 
  Plus, 
  Save, 
  GraduationCap, 
  BookOpen, 
  FileCheck,
  User,
  AlertTriangle,
  Lightbulb,
  Search,
  BookMarked,
  TrendingUp,
  TrendingDown,
  LineChart as LineChartIcon,
  CheckCircle2,
  Target,
  Sparkles,
  CloudUpload,
  CheckCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine 
} from 'recharts';
import { Student, StudentAcademicRecord, NationalExamPrep, SubjectGrade, StudentClass } from '../types';
import { CLASSES_LIST, getSubjectsForClass, calculateGrade } from '../constants';
import { batchSaveToSupabase } from '../services/supabaseSync';

interface AcademicPortalProps {
  students: Student[];
  records: StudentAcademicRecord[];
  examPreps: NationalExamPrep[];
  onUpdateRecord: (record: StudentAcademicRecord) => void;
  onUpdateExamPrep: (examPrep: NationalExamPrep) => void;
  initialSelectedStudentId?: string;
  initialTab?: 'marks' | 'exams';
}

export default function AcademicPortal({ 
  students, 
  records, 
  examPreps, 
  onUpdateRecord, 
  onUpdateExamPrep,
  initialSelectedStudentId,
  initialTab = 'marks'
}: AcademicPortalProps) {
  
  // Outer Tabs: "Marks Entry" vs "National Exam Candidates"
  const [activeTab, setActiveTab] = useState<'marks' | 'exams'>(initialTab);

  // --- Sub-State for Marks Entry ---
  const [selectedClass, setSelectedClass] = useState<StudentClass>(
    initialSelectedStudentId 
      ? (students.find(s => s.id === initialSelectedStudentId)?.currentClass || 'Class 1')
      : 'Class 1'
  );
  
  const classStudents = students.filter(s => s.currentClass === selectedClass && s.status === 'Active');
  
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialSelectedStudentId || (classStudents[0]?.id || '')
  );
  
  const [selectedTerm, setSelectedTerm] = useState<1 | 2 | 3>(3);
  const [isEditingMarks, setIsEditingMarks] = useState(false);
  const [trendViewMode, setTrendViewMode] = useState<'overall' | 'subjects'>('overall');

  // Load the selected record or create a blank one if missing (defensive)
  const activeRecord = records.find(r => r.studentId === selectedStudentId);
  const activeStudent = students.find(s => s.id === selectedStudentId);

  // Form states for temporary edits
  const [editGrades, setEditGrades] = useState<SubjectGrade[]>([]);
  const [editTeacherRemarks, setEditTeacherRemarks] = useState('');
  const [editPrincipalRemarks, setEditPrincipalRemarks] = useState('');
  const [editConduct, setEditConduct] = useState('');
  const [editAttendance, setEditAttendance] = useState({ totalDays: 70, presentDays: 65 });

  // Sync all academic records directly to Supabase for reference
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleSyncGradesToSupabase = async () => {
    setIsSyncingSupabase(true);
    setSyncFeedback(null);
    try {
      const ok = await batchSaveToSupabase('academic_records', records, 'studentId');
      if (ok) {
        setSyncFeedback(`Successfully saved all ${records.length} academic files to Supabase database for reference!`);
      } else {
        setSyncFeedback('Failed saving academic records to Supabase.');
      }
    } catch (e: any) {
      setSyncFeedback(e?.message || 'Error saving to Supabase.');
    } finally {
      setIsSyncingSupabase(false);
      setTimeout(() => setSyncFeedback(null), 5000);
    }
  };

  // Terminal Performance Trend Data (Term 1, Term 2, Term 3) for the Recharts Line Graph
  const terminalTrendData = useMemo(() => {
    if (!activeRecord || !activeStudent) return [];

    const terms: Array<1 | 2 | 3> = [1, 2, 3];
    
    // Class peers for benchmark comparison
    const classRecords = records.filter(r => {
      const st = students.find(s => s.id === r.studentId);
      return st && st.currentClass === activeStudent.currentClass && st.status === 'Active';
    });

    return terms.map(termNum => {
      const termPerf = activeRecord?.terms?.[termNum];
      const studentGrades = termPerf?.grades || [];
      const studentAvg = studentGrades.length > 0
        ? Math.round(studentGrades.reduce((sum, g) => sum + g.totalScore, 0) / studentGrades.length)
        : null;

      // Class average for this term
      let classSum = 0;
      let classCount = 0;
      classRecords.forEach(cr => {
        const cGrades = cr?.terms?.[termNum]?.grades || [];
        if (cGrades.length > 0) {
          classSum += cGrades.reduce((s, g) => s + g.totalScore, 0) / cGrades.length;
          classCount++;
        }
      });
      const classAvg = classCount > 0 ? Math.round(classSum / classCount) : null;

      // Attendance rate for this term
      const attendance = termPerf?.attendance;
      const attendanceRate = attendance && attendance.totalDays > 0
        ? Math.round((attendance.presentDays / attendance.totalDays) * 100)
        : null;

      // Subject scores across terms for subject breakdown mode
      const mathScore = studentGrades.find(g => g.subject.toLowerCase().includes('math'))?.totalScore ?? null;
      const engScore = studentGrades.find(g => g.subject.toLowerCase().includes('english'))?.totalScore ?? null;
      const sciScore = studentGrades.find(g => g.subject.toLowerCase().includes('science'))?.totalScore ?? null;
      const socScore = studentGrades.find(g => g.subject.toLowerCase().includes('social'))?.totalScore ?? null;

      return {
        term: `Term ${termNum}`,
        termNum,
        studentAverage: studentAvg,
        classAverage: classAvg,
        benchmarkPass: 50,
        attendanceRate,
        presentDays: attendance?.presentDays || 0,
        totalDays: attendance?.totalDays || 0,
        mathematics: mathScore,
        english: engScore,
        science: sciScore,
        socialStudies: socScore
      };
    });
  }, [activeRecord, activeStudent, records, students]);

  // Overall metrics derived from trend data
  const trendMetrics = useMemo(() => {
    const validScores = terminalTrendData
      .map(d => d.studentAverage)
      .filter((s): s is number => typeof s === 'number' && !isNaN(s));

    if (validScores.length === 0) {
      return { yearAverage: 0, highestTerm: 'N/A', delta: 0, status: 'No Data', isPositive: true };
    }

    const yearAverage = Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length);
    const maxScore = Math.max(...validScores);
    const highestTermItem = terminalTrendData.find(d => d.studentAverage === maxScore);
    const highestTerm = highestTermItem ? `${highestTermItem.term} (${maxScore}%)` : 'N/A';

    const firstTermScore = terminalTrendData[0]?.studentAverage ?? validScores[0];
    const latestTermScore = validScores[validScores.length - 1];
    const delta = latestTermScore - firstTermScore;

    return {
      yearAverage,
      highestTerm,
      delta,
      status: delta > 0 ? `+${delta}% Growth` : delta < 0 ? `${delta}% Decline` : 'Consistent (0%)',
      isPositive: delta >= 0
    };
  }, [terminalTrendData]);

  // Handle student select change
  const handleStudentSelect = (id: string) => {
    setSelectedStudentId(id);
    setIsEditingMarks(false);
  };

  // Start editing grades
  const startEditing = () => {
    if (!activeRecord || !activeStudent) return;
    const termPerf = activeRecord?.terms?.[selectedTerm];
    
    // If the record doesn't have grades yet, initialize with blank grades for subjects
    let gradesToLoad = termPerf?.grades || [];
    if (gradesToLoad.length === 0) {
      const subjects = getSubjectsForClass(activeStudent.currentClass, activeStudent.stream);
      gradesToLoad = subjects.map((subj, idx) => {
        let defaultGrade = 'F9';
        if (activeStudent.currentClass.startsWith('University')) {
          defaultGrade = 'F';
        } else if (
          activeStudent.currentClass.startsWith('Class') || 
          activeStudent.currentClass.startsWith('Prep') || 
          activeStudent.currentClass.startsWith('Pre') || 
          activeStudent.currentClass.startsWith('Nursery')
        ) {
          defaultGrade = 'E';
        }
        return {
          id: `g-${activeStudent.id}-${selectedTerm}-${idx}`,
          subject: subj,
          caScore: 0,
          examScore: 0,
          totalScore: 0,
          grade: defaultGrade,
          remark: 'Fail'
        };
      });
    }

    setEditGrades(JSON.parse(JSON.stringify(gradesToLoad)));
    setEditTeacherRemarks(termPerf.teacherRemarks || '');
    setEditPrincipalRemarks(termPerf.principalRemarks || '');
    setEditConduct(termPerf.conduct || 'Excellent');
    setEditAttendance({
      totalDays: termPerf.attendance?.totalDays || 70,
      presentDays: termPerf.attendance?.presentDays || 65
    });
    setIsEditingMarks(true);
  };

  // Handle grade edits
  const handleScoreChange = (idx: number, type: 'ca' | 'exam', val: number) => {
    const updated = [...editGrades];
    const is40_60 = selectedClass.startsWith('Pre') || 
                    selectedClass.startsWith('Prep') || 
                    selectedClass.startsWith('Nursery') || 
                    selectedClass.startsWith('Class') ||
                    selectedClass.startsWith('University');
    
    if (type === 'ca') {
      const maxCA = is40_60 ? 40 : 30;
      updated[idx].caScore = Math.max(0, Math.min(maxCA, val));
    } else {
      const maxExam = is40_60 ? 60 : 70;
      updated[idx].examScore = Math.max(0, Math.min(maxExam, val));
    }

    updated[idx].totalScore = updated[idx].caScore + updated[idx].examScore;
    
    // Re-calculate WAEC or Primary Grade
    const { grade, remark } = calculateGrade(updated[idx].totalScore, selectedClass);
    updated[idx].grade = grade;
    updated[idx].remark = remark;

    setEditGrades(updated);
  };

  const saveMarks = () => {
    if (!activeRecord) return;
    
    const updatedRecord: StudentAcademicRecord = {
      ...activeRecord,
      terms: {
        ...activeRecord.terms,
        [selectedTerm]: {
          grades: editGrades,
          teacherRemarks: editTeacherRemarks,
          principalRemarks: editPrincipalRemarks,
          conduct: editConduct,
          attendance: editAttendance
        }
      }
    };

    onUpdateRecord(updatedRecord);
    setIsEditingMarks(false);
  };


  // --- Sub-State for National Exams (NPSE, BECE, WASSCE) ---
  const [examSearch, setExamSearch] = useState('');
  const [selectedExamFilter, setSelectedExamFilter] = useState<'All' | 'NPSE' | 'BECE' | 'WASSCE'>('All');
  
  // Candidates are JSS 3, SSS 3, Class 6
  const milestoneStudents = students.filter(s => 
    s.status === 'Active' && 
    (s.currentClass === 'Class 6' || s.currentClass === 'JSS 3' || s.currentClass === 'SSS 3')
  );

  // Filter exam preps
  const filteredExamPreps = examPreps.filter(ep => {
    const student = students.find(s => s.id === ep.studentId);
    if (!student) return false;
    const matchesSearch = student.name.toLowerCase().includes(examSearch.toLowerCase()) || 
                          (ep.indexNumber && ep.indexNumber.toLowerCase().includes(examSearch.toLowerCase()));
    const matchesType = selectedExamFilter === 'All' || ep.examType === selectedExamFilter;
    return matchesSearch && matchesType;
  });

  // Selected candidate to edit/view details
  const [selectedPrepId, setSelectedPrepId] = useState<string>(filteredExamPreps[0]?.studentId || '');
  const activePrep = examPreps.find(ep => ep.studentId === selectedPrepId);
  const prepStudent = students.find(s => s.id === selectedPrepId);

  // Edit fields for Exam Preps
  const [isEditingPrep, setIsEditingPrep] = useState(false);
  const [editIndexNumber, setEditIndexNumber] = useState('');
  const [editPrepRegistered, setEditPrepRegistered] = useState(false);
  const [editPrepRecommendation, setEditPrepRecommendation] = useState('');
  const [editPrepScores, setEditPrepScores] = useState<any[]>([]);

  const startEditingPrep = () => {
    if (!activePrep) return;
    setEditIndexNumber(activePrep.indexNumber || '');
    setEditPrepRegistered(activePrep.registered);
    setEditPrepRecommendation(activePrep.recommendation || '');
    setEditPrepScores(JSON.parse(JSON.stringify(activePrep.subjectsScores)));
    setIsEditingPrep(true);
  };

  const handlePrepScoreChange = (idx: number, score: number) => {
    const updated = [...editPrepScores];
    updated[idx].mockScore = Math.max(0, Math.min(100, score));
    
    // Automatically recalculate mock grade
    const classLevel = prepStudent?.currentClass || 'Class 6';
    const { grade } = calculateGrade(updated[idx].mockScore, classLevel);
    updated[idx].grade = grade;
    
    // Determine status alert
    if (updated[idx].mockScore >= 70) updated[idx].status = 'Ready';
    else if (updated[idx].mockScore >= 50) updated[idx].status = 'Review Needed';
    else updated[idx].status = 'Critical';

    setEditPrepScores(updated);
  };

  const savePrepData = () => {
    if (!activePrep) return;
    
    // Calculate new total score/credits
    let totalScoreValue = 0;
    if (activePrep.examType === 'NPSE') {
      // Sum mock scores
      totalScoreValue = editPrepScores.reduce((sum, s) => sum + s.mockScore, 0);
    } else {
      // Credit Count (grades of C6 or better)
      totalScoreValue = editPrepScores.filter(s => {
        const score = s.mockScore;
        // In WAEC, 50%+ (C6) is credit
        return score >= 50;
      }).length;
    }

    const updated: NationalExamPrep = {
      ...activePrep,
      indexNumber: editIndexNumber,
      registered: editPrepRegistered,
      recommendation: editPrepRecommendation,
      subjectsScores: editPrepScores,
      totalScore: totalScoreValue
    };

    onUpdateExamPrep(updated);
    setIsEditingPrep(false);
  };

  // Quick Action: Autofill standard subjects for exam prep
  const initializeExamPrep = (studentId: string, examType: 'NPSE' | 'BECE' | 'WASSCE') => {
    const stud = students.find(s => s.id === studentId);
    if (!stud) return;

    const subjects = getSubjectsForClass(stud.currentClass, stud.stream);
    const initialScores = subjects.map(sub => ({
      subject: sub,
      mockScore: 60,
      grade: stud.currentClass.startsWith('Class') ? 'C' : 'C6',
      status: 'Review Needed' as const
    }));

    const newPrep: NationalExamPrep = {
      studentId,
      examType,
      registered: true,
      indexNumber: `${examType === 'NPSE' ? 'NP' : examType === 'BECE' ? 'BE' : 'WA'}-349000-${Math.floor(100 + Math.random() * 899)}`,
      subjectsScores: initialScores,
      totalScore: examType === 'NPSE' ? 360 : 6,
      recommendation: 'Continuous trial test reviews scheduled before national testing.'
    };

    onUpdateExamPrep(newPrep);
    setSelectedPrepId(studentId);
  };

  return (
    <div className="space-y-6" id="academic-portal-panel">
      {/* Tab Selectors & Firebase Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-1.5 rounded-2xl shadow-xs border border-slate-100" id="academic-tab-headers">
        <div className="flex flex-1 gap-1">
          <button
            onClick={() => setActiveTab('marks')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'marks' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="w-4 h-4" /> Continuous Assessment & Marks
          </button>
          <button
            onClick={() => setActiveTab('exams')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'exams' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4" /> National Examinations Prep (WAEC)
          </button>
        </div>

        <button
          type="button"
          disabled={isSyncingSupabase}
          onClick={handleSyncGradesToSupabase}
          className="flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs transition-colors shadow-2xs cursor-pointer disabled:opacity-50 shrink-0 self-end sm:self-auto"
          title="Save all continuous assessment marks into Supabase database for reference uses"
          id="academic-save-supabase-btn"
        >
          <CloudUpload className={`w-3.5 h-3.5 ${isSyncingSupabase ? 'animate-bounce' : ''}`} />
          <span>{isSyncingSupabase ? 'Saving...' : 'Save Grades to Supabase (Reference)'}</span>
        </button>
      </div>

      {syncFeedback && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* VIEW 1: MARKS & GRADE ENTRY */}
      {activeTab === 'marks' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" id="marks-entry-portal">
          
          {/* Left Panel: Selector Sidebar */}
          <div className="space-y-4 lg:col-span-1">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              {/* Select Class */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Class Level</label>
                <select
                  value={selectedClass}
                  onChange={(e) => {
                    const cl = e.target.value as StudentClass;
                    setSelectedClass(cl);
                    // select first student in that class
                    const firstSt = students.find(s => s.currentClass === cl && s.status === 'Active');
                    if (firstSt) handleStudentSelect(firstSt.id);
                    else setSelectedStudentId('');
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {CLASSES_LIST.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Student List in Class */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Students ({classStudents.length})</label>
                <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
                  {classStudents.map(s => (
                    <button
                       key={s.id}
                       onClick={() => handleStudentSelect(s.id)}
                       className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                         selectedStudentId === s.id 
                           ? 'bg-indigo-50 text-indigo-800 font-semibold border-l-4 border-indigo-600' 
                           : 'hover:bg-slate-50 text-slate-600'
                       }`}
                     >
                      <span className="truncate">{s.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">{s.admissionNumber.split('-')[2]}</span>
                    </button>
                  ))}
                  {classStudents.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-4">No active students in {selectedClass}.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Academic Record Worksheet */}
          <div className="lg:col-span-3 space-y-4">
            {activeStudent && activeRecord ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                
                {/* Academic Record Header */}
                <div className="bg-slate-900 text-white p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {activeStudent.profileImage ? (
                      <img
                        src={activeStudent.profileImage}
                        alt={activeStudent.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-xl object-cover border border-slate-700"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                        {activeStudent.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-base">{activeStudent.name}</h3>
                      <p className="text-slate-400 text-xs">{activeStudent.currentClass} • Admin ID: {activeStudent.admissionNumber}</p>
                    </div>
                  </div>

                  {/* Term Select & Edit Trigger */}
                  <div className="flex items-center gap-3">
                    <div className="flex bg-slate-800 rounded-lg p-1 text-xs font-semibold">
                      {[1, 2, 3].map(t => (
                        <button
                          key={t}
                          disabled={isEditingMarks}
                          onClick={() => setSelectedTerm(t as any)}
                          className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                            selectedTerm === t 
                              ? 'bg-indigo-600 text-white' 
                              : 'text-slate-400 hover:text-white disabled:opacity-50'
                          }`}
                        >
                          Term {t}
                        </button>
                      ))}
                    </div>

                    {!isEditingMarks ? (
                      <button
                        onClick={startEditing}
                        className="flex items-center gap-1.5 py-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit Marks
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setIsEditingMarks(false)}
                          className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveMarks}
                          className="flex items-center gap-1 py-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" /> Save
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Main Worksheet Body */}
                <div className="p-6 space-y-6">
                  {/* Status Indicator (Read-only vs Edit Mode) */}
                  {isEditingMarks && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-2 text-xs text-amber-800 font-medium">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                      <div>
                        <p className="font-bold">CA & Exam Input Guidelines (Sierra Leone Standards):</p>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          {selectedClass.startsWith('Prep') || selectedClass.startsWith('Class') 
                            ? 'Primary levels: CA is scored out of 40 marks, Terminal Exam is scored out of 60 marks. Total 100.'
                            : 'Secondary levels (JSS/SSS): CA is scored out of 30 marks, Terminal Exam is scored out of 70 marks. Total 100.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* RECHARTS VISUALIZATION: Terminal Grade Average Trend Over Academic Year */}
                  <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 sm:p-5 space-y-4" id="terminal-grade-trend-chart-panel">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                            <LineChartIcon className="w-4 h-4" />
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm">Terminal Grade Average Trend (2025/2026)</h4>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Recharts
                          </span>
                        </div>
                        <p className="text-slate-500 text-xs mt-0.5">
                          Term-by-term score trajectory for {activeStudent.name} compared with {selectedClass} class benchmark
                        </p>
                      </div>

                      {/* Mode Switcher */}
                      <div className="flex items-center bg-white border border-slate-200 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto shadow-2xs">
                        <button
                          type="button"
                          onClick={() => setTrendViewMode('overall')}
                          className={`px-3 py-1 rounded-lg transition-all cursor-pointer text-xs ${
                            trendViewMode === 'overall'
                              ? 'bg-indigo-600 text-white font-bold shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Overall Average
                        </button>
                        <button
                          type="button"
                          onClick={() => setTrendViewMode('subjects')}
                          className={`px-3 py-1 rounded-lg transition-all cursor-pointer text-xs ${
                            trendViewMode === 'subjects'
                              ? 'bg-indigo-600 text-white font-bold shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Core Subjects
                        </button>
                      </div>
                    </div>

                    {/* Key Metrics Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/70 shadow-2xs">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Cumulative Average</span>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className="text-base font-black text-indigo-700">{trendMetrics.yearAverage}%</span>
                          <span className="text-[10px] text-slate-500 font-semibold">
                            ({calculateGrade(trendMetrics.yearAverage, selectedClass).grade})
                          </span>
                        </div>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/70 shadow-2xs">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Best Terminal Mark</span>
                        <span className="text-sm font-black text-slate-800 mt-0.5 block truncate">
                          {trendMetrics.highestTerm}
                        </span>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/70 shadow-2xs">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Annual Trajectory</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {trendMetrics.isPositive ? (
                            <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-rose-600 shrink-0" />
                          )}
                          <span className={`text-xs font-black ${trendMetrics.isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {trendMetrics.status}
                          </span>
                        </div>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/70 shadow-2xs">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Passing Benchmark</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Target className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="text-xs font-bold text-slate-700">50% Minimum</span>
                        </div>
                      </div>
                    </div>

                    {/* Recharts Line Chart Container */}
                    <div className="h-56 w-full bg-white rounded-xl p-3 border border-slate-200/70 shadow-2xs">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={terminalTrendData}
                          margin={{ top: 12, right: 16, left: -20, bottom: 4 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="term" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }}
                          />
                          <YAxis 
                            domain={[0, 100]} 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#64748b', fontSize: 10 }}
                            unit="%"
                          />
                          <Tooltip 
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1.5 min-w-[210px]">
                                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                      <span className="font-extrabold text-indigo-300">{label} Performance</span>
                                      <span className="text-[10px] text-slate-400">AY 2025/2026</span>
                                    </div>

                                    {trendViewMode === 'overall' ? (
                                      <>
                                        <div className="flex justify-between items-center pt-0.5">
                                          <span className="text-slate-300">Student Average:</span>
                                          <span className="text-emerald-400 font-black text-sm">
                                            {data.studentAverage !== null ? `${data.studentAverage}%` : 'Pending'}
                                          </span>
                                        </div>
                                        <div className="flex justify-between items-center text-slate-300 text-[11px]">
                                          <span>Class Benchmark:</span>
                                          <span className="font-semibold text-slate-200">
                                            {data.classAverage !== null ? `${data.classAverage}%` : 'N/A'}
                                          </span>
                                        </div>
                                        {data.studentAverage !== null && data.classAverage !== null && (
                                          <div className="flex justify-between items-center text-[10px] text-indigo-300 pt-1 border-t border-slate-800">
                                            <span>Deviation:</span>
                                            <span className="font-bold">
                                              {data.studentAverage >= data.classAverage ? `+${data.studentAverage - data.classAverage}% Above` : `${data.studentAverage - data.classAverage}% Below`}
                                            </span>
                                          </div>
                                        )}
                                        {data.attendanceRate !== null && (
                                          <div className="flex justify-between items-center text-[10px] text-slate-400">
                                            <span>Attendance:</span>
                                            <span>{data.attendanceRate}% ({data.presentDays}/{data.totalDays} Days)</span>
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <div className="space-y-1 pt-0.5">
                                        <div className="flex justify-between text-[11px]">
                                          <span className="text-blue-300">Mathematics:</span>
                                          <span className="font-bold text-white">{data.mathematics ?? 'N/A'}%</span>
                                        </div>
                                        <div className="flex justify-between text-[11px]">
                                          <span className="text-purple-300">English Language:</span>
                                          <span className="font-bold text-white">{data.english ?? 'N/A'}%</span>
                                        </div>
                                        <div className="flex justify-between text-[11px]">
                                          <span className="text-emerald-300">Integrated Science:</span>
                                          <span className="font-bold text-white">{data.science ?? 'N/A'}%</span>
                                        </div>
                                        <div className="flex justify-between text-[11px]">
                                          <span className="text-amber-300">Social Studies:</span>
                                          <span className="font-bold text-white">{data.socialStudies ?? 'N/A'}%</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend 
                            wrapperStyle={{ paddingTop: '8px', fontSize: '11px', fontWeight: 600 }}
                            iconType="circle"
                          />
                          <ReferenceLine 
                            y={50} 
                            stroke="#f59e0b" 
                            strokeDasharray="3 3" 
                            label={{ value: 'Pass Benchmark (50%)', fill: '#d97706', fontSize: 10, position: 'insideBottomRight' }}
                          />

                          {trendViewMode === 'overall' ? (
                            <>
                              <Line
                                type="monotone"
                                dataKey="studentAverage"
                                name="Student Terminal Average"
                                stroke="#4f46e5"
                                strokeWidth={3}
                                dot={{ fill: '#4f46e5', r: 5, strokeWidth: 2, stroke: '#ffffff' }}
                                activeDot={{ r: 7, stroke: '#4f46e5', strokeWidth: 2, fill: '#ffffff' }}
                                connectNulls
                              />
                              <Line
                                type="monotone"
                                dataKey="classAverage"
                                name="Class Benchmark Average"
                                stroke="#10b981"
                                strokeWidth={2}
                                strokeDasharray="4 4"
                                dot={{ fill: '#10b981', r: 4 }}
                                connectNulls
                              />
                            </>
                          ) : (
                            <>
                              <Line
                                type="monotone"
                                dataKey="mathematics"
                                name="Mathematics"
                                stroke="#3b82f6"
                                strokeWidth={2.5}
                                dot={{ fill: '#3b82f6', r: 4 }}
                                connectNulls
                              />
                              <Line
                                type="monotone"
                                dataKey="english"
                                name="English Language"
                                stroke="#8b5cf6"
                                strokeWidth={2.5}
                                dot={{ fill: '#8b5cf6', r: 4 }}
                                connectNulls
                              />
                              <Line
                                type="monotone"
                                dataKey="science"
                                name="Integrated Science"
                                stroke="#10b981"
                                strokeWidth={2.5}
                                dot={{ fill: '#10b981', r: 4 }}
                                connectNulls
                              />
                              <Line
                                type="monotone"
                                dataKey="socialStudies"
                                name="Social Studies"
                                stroke="#f59e0b"
                                strokeWidth={2.5}
                                dot={{ fill: '#f59e0b', r: 4 }}
                                connectNulls
                              />
                            </>
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Grades Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="py-2.5">Subject</th>
                          <th className="py-2.5 text-center">Continuous Assessment (CA)</th>
                          <th className="py-2.5 text-center">Terminal Exam</th>
                          <th className="py-2.5 text-center">Total Score (100)</th>
                          <th className="py-2.5 text-center">WAEC Grade</th>
                          <th className="py-2.5 text-right">Remark</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-slate-600 font-medium">
                        {/* If editing, show edit input fields */}
                        {isEditingMarks ? (
                          editGrades.map((g, idx) => (
                            <tr key={g.subject}>
                              <td className="py-3 font-semibold text-slate-800">{g.subject}</td>
                              <td className="py-3 text-center">
                                <input 
                                  type="number" 
                                  value={g.caScore}
                                  onChange={(e) => handleScoreChange(idx, 'ca', parseInt(e.target.value) || 0)}
                                  className="w-16 px-2 py-1 text-center bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
                                />
                              </td>
                              <td className="py-3 text-center">
                                <input 
                                  type="number" 
                                  value={g.examScore}
                                  onChange={(e) => handleScoreChange(idx, 'exam', parseInt(e.target.value) || 0)}
                                  className="w-16 px-2 py-1 text-center bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
                                />
                              </td>
                              <td className="py-3 text-center font-bold text-slate-800 text-sm">
                                {g.totalScore}
                              </td>
                              <td className="py-3 text-center">
                                <span className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold border`}>
                                  {g.grade}
                                </span>
                              </td>
                              <td className="py-3 text-right">
                                <span className="text-[11px] text-slate-400">{g.remark}</span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          // Read-only marks view
                          (activeRecord.terms[selectedTerm]?.grades.length > 0 
                            ? activeRecord.terms[selectedTerm].grades 
                            : []
                          ).map((g) => {
                            // Find color for the grade
                            const cl = selectedClass;
                            const isHigh = g.totalScore >= 70;
                            const isLow = g.totalScore < 45;
                            const gradeBadgeColor = isHigh 
                              ? 'text-indigo-700 bg-indigo-50 border-indigo-100' 
                              : isLow 
                                ? 'text-rose-700 bg-rose-50 border-rose-100' 
                                : 'text-slate-700 bg-slate-50 border-slate-100';

                            return (
                              <tr key={g.subject} className="hover:bg-slate-50/50">
                                <td className="py-3 font-semibold text-slate-800">{g.subject}</td>
                                <td className="py-3 text-center font-mono font-semibold text-slate-500">{g.caScore}</td>
                                <td className="py-3 text-center font-mono font-semibold text-slate-500">{g.examScore}</td>
                                <td className="py-3 text-center font-bold text-slate-800 text-sm font-mono">{g.totalScore}</td>
                                <td className="py-3 text-center">
                                  <span className={`inline-block px-2 py-0.5 rounded-md font-bold text-xs border ${gradeBadgeColor}`}>
                                    {g.grade}
                                  </span>
                                </td>
                                <td className="py-3 text-right font-medium text-slate-400">{g.remark}</td>
                              </tr>
                            );
                          })
                        )}
                        {!isEditingMarks && activeRecord.terms[selectedTerm]?.grades.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-400">
                              <BookMarked className="w-8 h-8 mx-auto text-slate-200 mb-2" />
                              No marks entered for Term {selectedTerm} yet. Click "Edit Marks" above to set up grades.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Remarks & Conduct */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-50 pt-6">
                    {/* Teacher / Principal Comments */}
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Teacher's Remarks</label>
                        {isEditingMarks ? (
                          <textarea 
                            value={editTeacherRemarks}
                            onChange={(e) => setEditTeacherRemarks(e.target.value)}
                            rows={2}
                            placeholder="Add continuous behavioral evaluation..."
                            className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 text-slate-700"
                          />
                        ) : (
                          <p className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 leading-relaxed italic border border-slate-100">
                            {activeRecord.terms[selectedTerm]?.teacherRemarks || 'No remark provided.'}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Principal's Directives</label>
                        {isEditingMarks ? (
                          <textarea 
                            value={editPrincipalRemarks}
                            onChange={(e) => setEditPrincipalRemarks(e.target.value)}
                            rows={2}
                            placeholder="Official promotion or academic review remarks..."
                            className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 text-slate-700"
                          />
                        ) : (
                          <p className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 leading-relaxed italic border border-slate-100">
                            {activeRecord.terms[selectedTerm]?.principalRemarks || 'No remark provided.'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Conduct, Attendance & Rank */}
                    <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Term Assessments & Registry</h4>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          {/* Conduct */}
                          <div className="space-y-1">
                            <span className="text-slate-400 font-medium">Student Conduct</span>
                            {isEditingMarks ? (
                              <select
                                value={editConduct}
                                onChange={(e) => setEditConduct(e.target.value)}
                                className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                              >
                                <option value="Excellent">Excellent</option>
                                <option value="Very Good">Very Good</option>
                                <option value="Satisfactory">Satisfactory</option>
                                <option value="Fair">Fair</option>
                                <option value="Needs Improvement">Needs Improvement</option>
                              </select>
                            ) : (
                              <p className="font-bold text-slate-700">{activeRecord.terms[selectedTerm]?.conduct || 'Excellent'}</p>
                            )}
                          </div>

                          {/* Attendance */}
                          <div className="space-y-1">
                            <span className="text-slate-400 font-medium">Attendance Record</span>
                            {isEditingMarks ? (
                              <div className="flex gap-2 items-center">
                                <input 
                                  type="number" 
                                  value={editAttendance.presentDays}
                                  onChange={(e) => setEditAttendance({...editAttendance, presentDays: parseInt(e.target.value) || 0})}
                                  className="w-12 px-1 py-0.5 text-center bg-white border border-slate-200 rounded"
                                />
                                <span>/</span>
                                <input 
                                  type="number" 
                                  value={editAttendance.totalDays}
                                  onChange={(e) => setEditAttendance({...editAttendance, totalDays: parseInt(e.target.value) || 0})}
                                  className="w-12 px-1 py-0.5 text-center bg-white border border-slate-200 rounded"
                                />
                              </div>
                            ) : (
                              <p className="font-bold text-slate-700">
                                {activeRecord.terms[selectedTerm]?.attendance?.presentDays || 0} / {activeRecord.terms[selectedTerm]?.attendance?.totalDays || 0} Days
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Display Class Position/Average */}
                      {!isEditingMarks && activeRecord.terms[selectedTerm]?.grades.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-200/50 flex justify-between items-center text-xs">
                          <div>
                            <p className="text-slate-400 font-medium">Term Average Score</p>
                            <p className="text-base font-bold text-indigo-600">
                              {Math.round(activeRecord.terms[selectedTerm].grades.reduce((sum, g) => sum + g.totalScore, 0) / activeRecord.terms[selectedTerm].grades.length)}%
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-slate-400 font-medium">Class Ranking Status</p>
                            <p className="text-xs font-semibold text-slate-700">Positions evaluated termly</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <User className="w-8 h-8 mx-auto text-slate-200 mb-2" />
                <p className="text-sm font-semibold">Select a student file to load worksheet records.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* VIEW 2: NATIONAL MILESTONE EXAMS */}
      {activeTab === 'exams' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" id="national-exams-portal">
          
          {/* Left Panel: Milestone Candidates list */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Milestone Exams Filter</label>
                <select
                  value={selectedExamFilter}
                  onChange={(e) => setSelectedExamFilter(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="All">All Tiers (NPSE, BECE, WASSCE)</option>
                  <option value="NPSE">NPSE (Class 6)</option>
                  <option value="BECE">BECE (JSS 3)</option>
                  <option value="WASSCE">WASSCE (SSS 3)</option>
                </select>
              </div>

              {/* Candidates Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input 
                  type="text" 
                  placeholder="Filter candidate..."
                  value={examSearch}
                  onChange={(e) => setExamSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              {/* List of Candidates */}
              <div className="space-y-1 max-h-[250px] overflow-y-auto pr-1">
                {milestoneStudents
                  .filter(s => {
                    const matchesType = selectedExamFilter === 'All' || 
                      (selectedExamFilter === 'NPSE' && s.currentClass === 'Class 6') ||
                      (selectedExamFilter === 'BECE' && s.currentClass === 'JSS 3') ||
                      (selectedExamFilter === 'WASSCE' && s.currentClass === 'SSS 3');
                    const matchesSearch = s.name.toLowerCase().includes(examSearch.toLowerCase());
                    return matchesType && matchesSearch;
                  })
                  .map(s => {
                    const examType = s.currentClass === 'Class 6' ? 'NPSE' : s.currentClass === 'JSS 3' ? 'BECE' : 'WASSCE';
                    const hasPrep = examPreps.some(ep => ep.studentId === s.id);
                    
                    return (
                      <button
                        key={s.id}
                        onClick={() => {
                          if (hasPrep) {
                            setSelectedPrepId(s.id);
                            setIsEditingPrep(false);
                          } else {
                            initializeExamPrep(s.id, examType);
                            setSelectedPrepId(s.id);
                            setIsEditingPrep(true);
                          }
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                          selectedPrepId === s.id 
                            ? 'bg-indigo-50 text-indigo-800 font-semibold border-l-4 border-indigo-600' 
                            : 'hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{s.name}</p>
                          <p className="text-[9px] text-slate-400">{s.currentClass} • {examType}</p>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                          hasPrep ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {hasPrep ? 'Active' : 'Unregistered'}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Right Panel: Trial Candidate Prep Record Card */}
          <div className="lg:col-span-3 space-y-4">
            {prepStudent && activePrep ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Header info */}
                <div className="bg-slate-900 text-white p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {prepStudent.profileImage ? (
                      <img
                        src={prepStudent.profileImage}
                        alt={prepStudent.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-xl object-cover border border-slate-700"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-base">{prepStudent.name}</h3>
                      <p className="text-slate-400 text-xs">National Exam: <span className="text-white font-bold">{activePrep.examType}</span> Candidate</p>
                    </div>
                  </div>

                  {!isEditingPrep ? (
                    <button
                      onClick={startEditingPrep}
                      className="flex items-center gap-1.5 py-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Modify Candidate Status
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditingPrep(false)}
                        className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={savePrepData}
                        className="flex items-center gap-1 py-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" /> Save Candidate
                      </button>
                    </div>
                  )}
                </div>

                {/* Candidate Dashboard */}
                <div className="p-6 space-y-6">
                  {/* Stats Ribbon */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Index Number */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">WAEC Index Number</span>
                      {isEditingPrep ? (
                        <input 
                          type="text" 
                          value={editIndexNumber}
                          onChange={(e) => setEditIndexNumber(e.target.value)}
                          placeholder="e.g. NP-349001-042"
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs mt-1"
                        />
                      ) : (
                        <p className="text-sm font-bold text-slate-800 mt-1 font-mono">{activePrep.indexNumber || 'NOT REG_YET'}</p>
                      )}
                    </div>

                    {/* Registration Status */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Registration Status</span>
                      {isEditingPrep ? (
                        <label className="flex items-center gap-2 mt-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={editPrepRegistered}
                            onChange={(e) => setEditPrepRegistered(e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          Officially Registered
                        </label>
                      ) : (
                        <p className={`text-sm font-bold mt-1 ${activePrep.registered ? 'text-indigo-600' : 'text-rose-500'}`}>
                          {activePrep.registered ? 'Registered (Active)' : 'Unregistered / Incomplete'}
                        </p>
                      )}
                    </div>

                    {/* Summary Metric */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        {activePrep.examType === 'NPSE' ? 'Projected Score' : 'Projected Credits (C6+)'}
                      </span>
                      <p className="text-lg font-black text-indigo-600 mt-1">
                        {activePrep.totalScore} 
                        <span className="text-xs text-slate-400 font-normal ml-1">
                          {activePrep.examType === 'NPSE' ? '/ 600 sum' : 'subjects qualified'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Candidate Trial Subject Marks */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Candidate Mock & Practice Exams Record</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {isEditingPrep ? (
                        editPrepScores.map((scoreObj, idx) => (
                          <div key={scoreObj.subject} className="p-3 border border-slate-100 rounded-xl flex justify-between items-center bg-slate-50/50">
                            <span className="text-xs font-semibold text-slate-700 truncate max-w-[150px]">{scoreObj.subject}</span>
                            <div className="flex items-center gap-3">
                              <input 
                                type="number" 
                                value={scoreObj.mockScore}
                                onChange={(e) => handlePrepScoreChange(idx, parseInt(e.target.value) || 0)}
                                className="w-14 text-center py-1 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
                              />
                              <span className="text-xs font-bold text-slate-400 font-mono w-6">{scoreObj.grade}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        activePrep.subjectsScores.map((scoreObj) => {
                          const isSuccess = scoreObj.status === 'Ready';
                          const isWarning = scoreObj.status === 'Review Needed';
                          
                          const statusStyle = isSuccess 
                            ? 'text-indigo-700 bg-indigo-50 border-indigo-100' 
                            : isWarning 
                              ? 'text-amber-700 bg-amber-50 border-amber-100' 
                              : 'text-rose-700 bg-rose-50 border-rose-100';

                          return (
                            <div key={scoreObj.subject} className="p-3 border border-slate-50 rounded-xl flex justify-between items-center hover:bg-slate-50/20">
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-700 truncate">{scoreObj.subject}</p>
                                <p className="text-[10px] text-slate-400 font-mono">Mock score: {scoreObj.mockScore}%</p>
                              </div>
                              <div className="text-right flex items-center gap-3">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusStyle}`}>
                                  {scoreObj.status}
                                </span>
                                <span className="text-xs font-bold text-slate-800 font-mono">{scoreObj.grade}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Advisor Recommendations (Heuristics AI Advisor) */}
                  <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100/50 space-y-2">
                    <div className="flex gap-2 text-indigo-800 font-semibold text-xs">
                      <Lightbulb className="w-4 h-4 shrink-0 text-indigo-600" />
                      <span>HEURISTIC ACADEMIC ADVISOR</span>
                    </div>

                    {isEditingPrep ? (
                      <textarea 
                        value={editPrepRecommendation}
                        onChange={(e) => setEditPrepRecommendation(e.target.value)}
                        rows={3}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 text-slate-700"
                        placeholder="Provide customized tutorial suggestions or milestones..."
                      />
                    ) : (
                      <p className="text-slate-600 text-xs leading-relaxed">
                        {activePrep.recommendation || 'Continuous testing recommended.'}
                      </p>
                    )}
                  </div>

                </div>

              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <GraduationCap className="w-8 h-8 mx-auto text-slate-200 mb-2" />
                <p className="text-sm font-semibold">Select a milestone candidate (Class 6, JSS 3, SSS 3) to view WAEC prep records.</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
