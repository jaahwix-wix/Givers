/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Check, 
  X, 
  Clock, 
  Save, 
  Search, 
  Users, 
  AlertCircle, 
  Award,
  CheckCircle,
  FileSpreadsheet,
  TrendingUp
} from 'lucide-react';
import { Student, StudentClass } from '../types';
import { CLASSES_LIST } from '../constants';
import { syncFirestoreCollection, batchSaveToFirestore } from '../services/firestoreSync';

interface StudentAttendancePanelProps {
  students: Student[];
}

interface AttendanceRecord {
  id: string; // studentId-date
  studentId: string;
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Absent' | 'Late';
}

export default function StudentAttendancePanel({ students }: StudentAttendancePanelProps) {
  // 1. Current selection states
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Default to today
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  });
  
  const [selectedClass, setSelectedClass] = useState<StudentClass>('Class 1');
  const [searchStudentTerm, setSearchStudentTerm] = useState('');
  
  // 2. Attendance database state
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isSavedMessage, setIsSavedMessage] = useState(false);

  // Load attendance logs with Cloud Firestore & local cache
  useEffect(() => {
    const unsub = syncFirestoreCollection<AttendanceRecord>(
      'daily_attendance',
      'sma_daily_attendance',
      (records) => setAttendanceRecords(records),
      []
    );

    const handleWiped = () => {
      setAttendanceRecords([]);
    };

    window.addEventListener('sma_database_wiped', handleWiped);

    return () => {
      unsub();
      window.removeEventListener('sma_database_wiped', handleWiped);
    };
  }, []);

  // Current date logging sheet state (holds temporary status changes before saving)
  const [currentLoggingSheet, setCurrentLoggingSheet] = useState<Record<string, 'Present' | 'Absent' | 'Late'>>({});

  // Get active students in selected class
  const classStudents = students.filter(
    s => s.status === 'Active' && s.currentClass === selectedClass
  );

  // Sync temporary currentLoggingSheet when selectedDate or selectedClass changes
  useEffect(() => {
    const sheet: Record<string, 'Present' | 'Absent' | 'Late'> = {};
    classStudents.forEach(s => {
      const match = attendanceRecords.find(
        r => r.studentId === s.id && r.date === selectedDate
      );
      // default to 'Present' if no record exists yet
      sheet[s.id] = match ? match.status : 'Present';
    });
    setCurrentLoggingSheet(sheet);
  }, [selectedDate, selectedClass, attendanceRecords]);

  // Handle status toggle
  const handleStatusChange = (studentId: string, status: 'Present' | 'Absent' | 'Late') => {
    setCurrentLoggingSheet(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  // Mark all as Present shortcut
  const handleMarkAllPresent = () => {
    const updated = { ...currentLoggingSheet };
    classStudents.forEach(s => {
      updated[s.id] = 'Present';
    });
    setCurrentLoggingSheet(updated);
  };

  // Save current sheet to master records
  const handleSaveAttendance = () => {
    let updatedRecords = [...attendanceRecords];
    
    Object.entries(currentLoggingSheet).forEach(([studentId, status]) => {
      const targetId = `${studentId}-${selectedDate}`;
      const existingIdx = updatedRecords.findIndex(r => r.id === targetId);
      
      if (existingIdx > -1) {
        updatedRecords[existingIdx].status = status;
      } else {
        updatedRecords.push({
          id: targetId,
          studentId,
          date: selectedDate,
          status
        });
      }
    });

    setAttendanceRecords(updatedRecords);
    try {
      localStorage.setItem('sma_daily_attendance', JSON.stringify(updatedRecords));
    } catch {}
    batchSaveToFirestore('daily_attendance', updatedRecords);
    
    setIsSavedMessage(true);
    setTimeout(() => setIsSavedMessage(false), 3000);
  };

  // Calculate Monthly Metrics
  const currentYearMonth = selectedDate.substring(0, 7); // "YYYY-MM"
  
  // Get all unique logging dates in this month for calculation
  const monthlyLogsForClass = attendanceRecords.filter(r => {
    const isThisMonth = r.date.startsWith(currentYearMonth);
    const student = students.find(s => s.id === r.studentId);
    const isThisClass = student?.currentClass === selectedClass;
    return isThisMonth && isThisClass;
  });

  const uniqueDatesThisMonth = Array.from(
    new Set(monthlyLogsForClass.map(r => r.date))
  ).sort();

  // Compute student stats
  const getStudentMonthlyStats = (studentId: string) => {
    const studentRecords = attendanceRecords.filter(
      r => r.studentId === studentId && r.date.startsWith(currentYearMonth)
    );
    
    const totalDays = studentRecords.length;
    if (totalDays === 0) {
      // Fallback/Default: represent high standing
      return { percentage: 100, present: 0, absent: 0, late: 0, total: 0 };
    }

    const presentDays = studentRecords.filter(r => r.status === 'Present').length;
    const lateDays = studentRecords.filter(r => r.status === 'Late').length;
    const absentDays = studentRecords.filter(r => r.status === 'Absent').length;

    // Late counts as attending but flagged. Formula: (Present + Late) / Total
    const percentage = Math.round(((presentDays + lateDays) / totalDays) * 100);

    return {
      percentage,
      present: presentDays,
      absent: absentDays,
      late: lateDays,
      total: totalDays
    };
  };

  // Overall class average attendance rate
  const classStatsList = classStudents.map(s => getStudentMonthlyStats(s.id));
  const validStats = classStatsList.filter(st => st.total > 0);
  const classAvgPercentage = validStats.length > 0 
    ? Math.round(validStats.reduce((acc, curr) => acc + curr.percentage, 0) / validStats.length)
    : 95; // default aesthetic average

  const perfectAttendanceCount = classStudents.filter(s => {
    const stats = getStudentMonthlyStats(s.id);
    return stats.total > 0 && stats.percentage === 100;
  }).length;

  const lowAttendanceWarningCount = classStudents.filter(s => {
    const stats = getStudentMonthlyStats(s.id);
    return stats.total > 0 && stats.percentage < 85;
  }).length;

  // Filter class list based on search bar
  const searchedClassStudents = classStudents.filter(s =>
    s.name.toLowerCase().includes(searchStudentTerm.toLowerCase()) ||
    s.admissionNumber.toLowerCase().includes(searchStudentTerm.toLowerCase())
  );

  // Helper for month formatting
  const getFormattedMonthName = () => {
    const [year, month] = currentYearMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('default', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="attendance-workspace">
      
      {/* LEFT COLUMN: DAILY LOGGING SHEET */}
      <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" /> Daily Roll Call
              </h3>
              <p className="text-xs text-slate-400 mt-1">Select class grade and date to log presence status.</p>
            </div>

            {/* Config pickers */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Class picker */}
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value as StudentClass)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                {CLASSES_LIST.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>

              {/* Date Input */}
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer font-mono"
              />
            </div>
          </div>

          {/* Quick operations */}
          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100/60">
            <span className="text-[11px] font-semibold text-slate-500">
              Active Roll Call Count: <span className="text-slate-800 font-bold">{classStudents.length} Students</span>
            </span>
            {classStudents.length > 0 && (
              <button
                type="button"
                onClick={handleMarkAllPresent}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer flex items-center gap-1"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Mark All Present
              </button>
            )}
          </div>

          {/* Student rows list */}
          <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
            {searchedClassStudents.map(student => {
              const currentStatus = currentLoggingSheet[student.id] || 'Present';
              
              return (
                <div 
                  key={student.id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200/80 transition-all gap-3 bg-white"
                >
                  {/* Student details */}
                  <div className="flex items-center gap-2.5">
                    {student.profileImage ? (
                      <img
                        src={student.profileImage}
                        alt={student.name}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-800 flex items-center justify-center font-bold text-[11px]">
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">{student.name}</h4>
                      <p className="text-[10px] font-mono text-slate-400">{student.admissionNumber}</p>
                    </div>
                  </div>

                  {/* Status Toggle Radio Group */}
                  <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/50">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, 'Present')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        currentStatus === 'Present'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-slate-600 bg-transparent'
                      }`}
                    >
                      <Check className="w-3 h-3" /> Present
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, 'Late')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        currentStatus === 'Late'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'text-slate-400 hover:text-slate-500 bg-transparent'
                      }`}
                    >
                      <Clock className="w-3 h-3" /> Late
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, 'Absent')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        currentStatus === 'Absent'
                          ? 'bg-rose-500 text-white shadow-xs'
                          : 'text-slate-400 hover:text-rose-500 bg-transparent'
                      }`}
                    >
                      <X className="w-3 h-3" /> Absent
                    </button>
                  </div>
                </div>
              );
            })}

            {classStudents.length === 0 && (
              <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold">No active students registered in {selectedClass}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Please add or transfer active students to this grade level.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer controls */}
        {classStudents.length > 0 && (
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
            <div className="flex items-center gap-2">
              {isSavedMessage && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 animate-pulse">
                  ✓ Attendance saved successfully to school ledger!
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleSaveAttendance}
              className="w-full sm:w-auto flex items-center justify-center gap-2 py-2 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
            >
              <Save className="w-4 h-4" /> Save Daily Roll Ledger
            </button>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: MONTHLY ANALYTICS & VISUALIZATION */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Statistics Card Summary */}
        <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-2xl p-5 shadow-sm space-y-4 border border-indigo-950 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <TrendingUp className="w-32 h-32" />
          </div>

          <div className="space-y-1">
            <span className="text-[9px] uppercase font-bold tracking-wider text-indigo-300 block font-mono">
              Monthly Intelligence Dashboard
            </span>
            <h3 className="font-black text-base text-white truncate">{getFormattedMonthName()}</h3>
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-2">
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <span className="text-[8px] text-indigo-200 uppercase tracking-wider block font-bold">Class Avg</span>
              <span className="text-lg font-extrabold text-white mt-1 block font-mono">{classAvgPercentage}%</span>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <span className="text-[8px] text-indigo-200 uppercase tracking-wider block font-bold">Perfect (100%)</span>
              <span className="text-lg font-extrabold text-emerald-300 mt-1 block font-mono">{perfectAttendanceCount}</span>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <span className="text-[8px] text-indigo-200 uppercase tracking-wider block font-bold">Low (&lt;85%)</span>
              <span className="text-lg font-extrabold text-rose-300 mt-1 block font-mono">{lowAttendanceWarningCount}</span>
            </div>
          </div>
        </div>

        {/* Searchable student monthly statistics with simple progress bars */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="space-y-1">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Attendance Standings ({getFormattedMonthName()})</h4>
            <p className="text-[10px] text-slate-400">Visualization of monthly rates. Present / Late records contribute to standing.</p>
          </div>

          {/* Inline filter search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student progress..."
              value={searchStudentTerm}
              onChange={(e) => setSearchStudentTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-[11px] focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Student progress bars */}
          <div className="space-y-3 max-h-[310px] overflow-y-auto pr-1">
            {searchedClassStudents.map(student => {
              const stats = getStudentMonthlyStats(student.id);
              
              const isLow = stats.total > 0 && stats.percentage < 85;
              const barColor = isLow ? 'bg-rose-500' : (stats.percentage >= 95 ? 'bg-emerald-500' : 'bg-indigo-600');
              const textColor = isLow ? 'text-rose-600' : (stats.percentage >= 95 ? 'text-emerald-600' : 'text-slate-700');

              return (
                <div key={student.id} className="space-y-1.5 p-2 bg-slate-50/50 rounded-xl border border-slate-100/40">
                  <div className="flex justify-between items-center text-[10px]">
                    <div className="font-bold text-slate-700 truncate max-w-[170px]">{student.name}</div>
                    <div className={`font-mono font-bold ${textColor}`}>
                      {stats.percentage}% <span className="text-slate-400 font-normal">({stats.present + stats.late}/{stats.total} days)</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${stats.percentage}%` }}
                    />
                  </div>

                  {/* Badges */}
                  <div className="flex justify-between items-center text-[8px] text-slate-400 font-medium">
                    <div className="flex gap-2">
                      <span>Late: <span className="font-bold text-amber-600">{stats.late}d</span></span>
                      <span>Absent: <span className="font-bold text-rose-600">{stats.absent}d</span></span>
                    </div>
                    {isLow && (
                      <span className="text-[8px] font-black uppercase text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded">
                        Critical Warning
                      </span>
                    )}
                    {stats.percentage === 100 && stats.total > 0 && (
                      <span className="text-[8px] font-black uppercase text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                        <Award className="w-2.5 h-2.5" /> Perfect
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {searchedClassStudents.length === 0 && (
              <div className="py-8 text-center text-slate-400">
                <AlertCircle className="w-6 h-6 mx-auto text-slate-300 mb-1" />
                <p className="text-[11px]">No students found matching your criteria</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
