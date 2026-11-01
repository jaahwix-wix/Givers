/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Award, 
  BarChart3, 
  LineChart as LineChartIcon, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles,
  Info,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Cell 
} from 'recharts';
import { Student, StudentAcademicRecord, StudentClass } from '../types';

interface PerformanceTrendsCardProps {
  records: StudentAcademicRecord[];
  students: Student[];
  onNavigate?: (tab: string, arg?: any) => void;
}

export interface ClassTermPerformance {
  className: string;
  shortName: string;
  term1Avg: number;
  term2Avg: number;
  term3Avg: number;
  studentCount: number;
  overallAvg: number;
  trendDelta: number; // Term 3 - Term 1
}

// Canonical ordering of Sierra Leone curriculum classes
const ORDERED_CLASSES: StudentClass[] = [
  'Nursery 1', 'Nursery 2', 'Nursery 3',
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6',
  'JSS 1', 'JSS 2', 'JSS 3',
  'SSS 1', 'SSS 2', 'SSS 3',
  'University Year 1', 'University Year 2', 'University Year 3', 'University Year 4'
];

export default function PerformanceTrendsCard({ records, students, onNavigate }: PerformanceTrendsCardProps) {
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [tierFilter, setTierFilter] = useState<'all' | 'primary' | 'jss' | 'sss' | 'uni'>('all');

  // Compute average performance per class across Terms 1, 2, and 3
  const classPerformanceData = useMemo<ClassTermPerformance[]>(() => {
    // Collect all classes present either in active students or canonical list
    const activeStudents = students.filter(s => s.status === 'Active');
    const existingClasses = Array.from(new Set(activeStudents.map(s => s.currentClass as StudentClass)));
    
    // Use existing classes if available, ordered by canonical order; fallback to canonical classes
    const classesToProcess = existingClasses.length > 0 
      ? ORDERED_CLASSES.filter(c => existingClasses.includes(c)).concat(
          existingClasses.filter(c => !ORDERED_CLASSES.includes(c))
        )
      : ORDERED_CLASSES;

    return classesToProcess.map(cls => {
      const classStudents = activeStudents.filter(s => s.currentClass === cls);
      
      const computeTermAvg = (termNumber: 1 | 2 | 3): number => {
        const studentAverages: number[] = [];
        
        classStudents.forEach(student => {
          const record = records.find(r => r.studentId === student.id);
          if (!record || !record.terms || !record.terms[termNumber]) return;
          
          const grades = record.terms[termNumber].grades || [];
          if (grades.length > 0) {
            const sum = grades.reduce((acc, g) => acc + (g.totalScore || 0), 0);
            studentAverages.push(sum / grades.length);
          }
        });

        if (studentAverages.length === 0) {
          // If no records yet for this class, return 0
          return 0;
        }

        const avg = studentAverages.reduce((a, b) => a + b, 0) / studentAverages.length;
        return Number(avg.toFixed(1));
      };

      const t1 = computeTermAvg(1);
      const t2 = computeTermAvg(2);
      const t3 = computeTermAvg(3);

      const termsWithScores = [t1, t2, t3].filter(v => v > 0);
      const overall = termsWithScores.length > 0 
        ? Number((termsWithScores.reduce((a, b) => a + b, 0) / termsWithScores.length).toFixed(1))
        : 0;

      const delta = (t1 > 0 && t3 > 0) ? Number((t3 - t1).toFixed(1)) : 0;

      // Make short display name for mobile readability
      const shortName = (cls || '').replace('Class ', 'C').replace('Nursery ', 'Nur ').replace('University ', 'Uni ');

      return {
        className: cls,
        shortName,
        term1Avg: t1,
        term2Avg: t2,
        term3Avg: t3,
        studentCount: classStudents.length,
        overallAvg: overall,
        trendDelta: delta
      };
    });
  }, [records, students]);

  // Filtered by tier
  const filteredData = useMemo(() => {
    if (tierFilter === 'primary') {
      return classPerformanceData.filter(d => (d.className || '').startsWith('Class') || (d.className || '').startsWith('Nur'));
    }
    if (tierFilter === 'jss') {
      return classPerformanceData.filter(d => (d.className || '').startsWith('JSS'));
    }
    if (tierFilter === 'sss') {
      return classPerformanceData.filter(d => (d.className || '').startsWith('SSS'));
    }
    if (tierFilter === 'uni') {
      return classPerformanceData.filter(d => (d.className || '').startsWith('University'));
    }
    return classPerformanceData;
  }, [classPerformanceData, tierFilter]);

  // Aggregate School-Wide Term Metrics
  const schoolSummary = useMemo(() => {
    let t1Sum = 0; let t1Count = 0;
    let t2Sum = 0; let t2Count = 0;
    let t3Sum = 0; let t3Count = 0;

    classPerformanceData.forEach(d => {
      if (d.term1Avg > 0) { t1Sum += d.term1Avg; t1Count++; }
      if (d.term2Avg > 0) { t2Sum += d.term2Avg; t2Count++; }
      if (d.term3Avg > 0) { t3Sum += d.term3Avg; t3Count++; }
    });

    const t1Avg = t1Count > 0 ? Number((t1Sum / t1Count).toFixed(1)) : 0;
    const t2Avg = t2Count > 0 ? Number((t2Sum / t2Count).toFixed(1)) : 0;
    const t3Avg = t3Count > 0 ? Number((t3Sum / t3Count).toFixed(1)) : 0;

    const overallDelta = (t1Avg > 0 && t3Avg > 0) ? Number((t3Avg - t1Avg).toFixed(1)) : 0;

    // Top performing class in Term 3
    const classesWithT3 = [...classPerformanceData].filter(c => c.term3Avg > 0);
    classesWithT3.sort((a, b) => b.term3Avg - a.term3Avg);
    const topClass = classesWithT3[0] || null;

    // Most improved class (Term 3 vs Term 1)
    const classesWithProgression = [...classPerformanceData].filter(c => c.term1Avg > 0 && c.term3Avg > 0);
    classesWithProgression.sort((a, b) => b.trendDelta - a.trendDelta);
    const mostImprovedClass = classesWithProgression[0] || null;

    const hasAnyRecord = t1Count > 0 || t2Count > 0 || t3Count > 0;

    return {
      t1Avg,
      t2Avg,
      t3Avg,
      overallDelta,
      topClass,
      mostImprovedClass,
      hasAnyRecord
    };
  }, [classPerformanceData]);

  return (
    <div 
      className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-5" 
      id="performance-trends-card"
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 shadow-2xs">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Performance Trends</h3>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Terms 1, 2 & 3
              </span>
            </div>
            <p className="text-slate-400 dark:text-slate-400 text-xs mt-0.5">
              Comparative average class performance across academic terms based on continuous assessment and exam marks
            </p>
          </div>
        </div>

        {/* Controls: Chart Type & Tier Filter */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Tier Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            {(['all', 'primary', 'jss', 'sss', 'uni'] as const).map(tier => (
              <button
                key={tier}
                type="button"
                onClick={() => setTierFilter(tier)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  tierFilter === tier
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {tier === 'all' ? 'All' : tier === 'uni' ? 'UNI' : tier.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Chart Type Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                chartType === 'bar'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Grouped Bar Chart"
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setChartType('line')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                chartType === 'line'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Trajectory Line Chart"
            >
              <LineChartIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* High-Level Term Averages Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Term 1 Average */}
        <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Term 1 Average</span>
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" title="Term 1 Indicator"></span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
              {schoolSummary.t1Avg > 0 ? `${schoolSummary.t1Avg}%` : '—'}
            </span>
            <span className="text-[10px] text-slate-400">marks</span>
          </div>
        </div>

        {/* Term 2 Average */}
        <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Term 2 Average</span>
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" title="Term 2 Indicator"></span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
              {schoolSummary.t2Avg > 0 ? `${schoolSummary.t2Avg}%` : '—'}
            </span>
            <span className="text-[10px] text-slate-400">marks</span>
          </div>
        </div>

        {/* Term 3 Average */}
        <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Term 3 Average</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Term 3 Indicator"></span>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
              {schoolSummary.t3Avg > 0 ? `${schoolSummary.t3Avg}%` : '—'}
            </span>
            <span className="text-[10px] text-slate-400">active cycle</span>
          </div>
        </div>

        {/* School Progress Trajectory */}
        <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">T1 → T3 Growth</span>
            {schoolSummary.overallDelta >= 0 ? (
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
            )}
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className={`text-xl font-extrabold ${schoolSummary.overallDelta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {schoolSummary.overallDelta > 0 ? `+${schoolSummary.overallDelta}%` : `${schoolSummary.overallDelta}%`}
            </span>
            <span className="text-[10px] text-slate-400">trajectory</span>
          </div>
        </div>
      </div>

      {/* Main Recharts Visualization Canvas */}
      <div className="h-72 w-full mt-2" id="recharts-performance-trends-container">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart
              data={filteredData}
              margin={{ top: 12, right: 12, left: -20, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="shortName" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
                tick={{ fill: '#64748b', fontSize: 11 }}
                unit="%"
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as ClassTermPerformance;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs space-y-2 min-w-[210px]">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                          <span className="font-bold text-indigo-300">{item.className}</span>
                          <span className="text-[10px] text-slate-400">{item.studentCount} Students</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5 text-slate-300">
                              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                              Term 1 Average:
                            </span>
                            <span className="font-bold text-indigo-300">{item.term1Avg > 0 ? `${item.term1Avg}%` : 'N/A'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5 text-slate-300">
                              <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                              Term 2 Average:
                            </span>
                            <span className="font-bold text-cyan-300">{item.term2Avg > 0 ? `${item.term2Avg}%` : 'N/A'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5 text-slate-300">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              Term 3 Average:
                            </span>
                            <span className="font-bold text-emerald-300">{item.term3Avg > 0 ? `${item.term3Avg}%` : 'N/A'}</span>
                          </div>
                        </div>
                        {item.trendDelta !== 0 && (
                          <div className="pt-1.5 border-t border-slate-800 flex justify-between items-center text-[11px]">
                            <span className="text-slate-400">Term-over-Term Trend:</span>
                            <span className={`font-bold ${item.trendDelta > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {item.trendDelta > 0 ? `+${item.trendDelta}%` : `${item.trendDelta}%`}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={32} 
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '11px', fontWeight: 600 }}
              />
              <Bar dataKey="term1Avg" name="Term 1 Average" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="term2Avg" name="Term 2 Average" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="term3Avg" name="Term 3 Average" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          ) : (
            <LineChart
              data={filteredData}
              margin={{ top: 12, right: 12, left: -20, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="shortName" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
                tick={{ fill: '#64748b', fontSize: 11 }}
                unit="%"
              />
              <Tooltip 
                cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as ClassTermPerformance;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1.5 min-w-[190px]">
                        <p className="font-bold text-indigo-300 border-b border-slate-800 pb-1">{item.className}</p>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Term 1:</span>
                          <span className="font-bold text-indigo-400">{item.term1Avg > 0 ? `${item.term1Avg}%` : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Term 2:</span>
                          <span className="font-bold text-cyan-400">{item.term2Avg > 0 ? `${item.term2Avg}%` : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Term 3:</span>
                          <span className="font-bold text-emerald-400">{item.term3Avg > 0 ? `${item.term3Avg}%` : 'N/A'}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={32} 
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '11px', fontWeight: 600 }}
              />
              <Line type="monotone" dataKey="term1Avg" name="Term 1 Average" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="term2Avg" name="Term 2 Average" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="term3Avg" name="Term 3 Average" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Footer Insights & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-500 shrink-0" />
          <span>
            {schoolSummary.topClass && schoolSummary.topClass.term3Avg > 0 ? (
              <>Top Performing: <strong className="text-slate-700 dark:text-slate-200">{schoolSummary.topClass.className}</strong> with {schoolSummary.topClass.term3Avg}% average</>
            ) : (
              <>Curriculum tracks: Nursery, Primary (Class 1–6), JSS & SSS</>
            )}
          </span>
        </div>
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('performance')}
            className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer self-start sm:self-auto"
          >
            <span>Open Academic Portal</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
