/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  Award, 
  CheckCircle2, 
  Monitor, 
  Building2, 
  ArrowRight,
  FileText,
  Sparkles,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { getSchoolPhotoSrc, onSchoolPhotosUpdated } from '../../../utils/photoManager';

interface AcademicsPageProps {
  onNavigate: (page: string) => void;
}

export default function AcademicsPage({ onNavigate }: AcademicsPageProps) {
  const [activeTier, setActiveTier] = useState<'all' | 'nursery' | 'primary' | 'jss' | 'sss' | 'college'>('all');
  const [, setUpdateTrigger] = useState(0);

  useEffect(() => {
    const unsub = onSchoolPhotosUpdated(() => setUpdateTrigger(prev => prev + 1));
    return unsub;
  }, []);

  const classroomImg = getSchoolPhotoSrc('IMG-20260918-WA0027.jpg');
  const nurseryGradImg = getSchoolPhotoSrc('IMG-20260918-WA0029.jpg');

  const TIERS = [
    {
      id: 'nursery',
      name: 'Nursery & Kindergarten',
      levels: 'Nursery 1, Nursery 2, Nursery 3',
      ages: 'Ages 3 – 5 Years',
      color: 'emerald',
      description: 'Foundational early childhood education emphasizing phonetic literacy, moral nursery rhymes, interactive play-based numeracy, social manners, and initial computer familiarity.',
      subjects: ['Phonics & Pre-Reading', 'Early Numeracy', 'Health & Hygiene', 'Bible Stories & Moral Rhymes', 'Creative Arts & Music'],
      highlights: 'Dedicated play equipment, child-safe nap and recreational rooms, caring trained early-years educators.'
    },
    {
      id: 'primary',
      name: 'Primary School (NPSE Center)',
      levels: 'Class 1 through Class 6',
      ages: 'Ages 6 – 11 Years',
      color: 'blue',
      description: 'Comprehensive primary school curriculum fully aligned with the Sierra Leone National Primary curriculum. Rigorous preparation for the National Primary School Examination (NPSE) with continuous terminal assessments.',
      subjects: ['Quantitative Aptitude', 'Verbal Aptitude', 'English Language', 'General Mathematics', 'Integrated Science', 'Social Studies'],
      highlights: '100% NPSE pass rate with students routinely gaining entry into top national secondary streams.'
    },
    {
      id: 'jss',
      name: 'Junior Secondary School (BECE Center)',
      levels: 'JSS 1, JSS 2, JSS 3',
      ages: 'Ages 12 – 14 Years',
      color: 'indigo',
      description: 'Bridging general foundational knowledge with pre-vocational and introductory sciences, preparing candidates for the Basic Education Certificate Examination (BECE).',
      subjects: ['Core Mathematics', 'Language Arts (English)', 'Integrated Science', 'Social Studies', 'Introductory Technology & ICT', 'French / Arabic', 'Religious & Moral Education'],
      highlights: 'Specialized subject tutors, practical laboratory demonstrations, mock exams with digital mark recording.'
    },
    {
      id: 'sss',
      name: 'Senior Secondary School (WASSCE Center)',
      levels: 'SSS 1, SSS 2, SSS 3 (Three Specialized Streams)',
      ages: 'Ages 15 – 18+ Years',
      color: 'purple',
      description: 'Accredited West African Senior School Certificate Examination (WASSCE) center providing three distinct specialized academic departments:',
      streams: [
        {
          name: 'Pure & Applied Sciences',
          courses: 'Physics, Chemistry, Biology, Further Mathematics, Core Mathematics, English Language'
        },
        {
          name: 'Arts & Humanities',
          courses: 'Literature in English, Government, History, Christian Religious Knowledge (CRK), Economics'
        },
        {
          name: 'Commercial & Business Studies',
          courses: 'Financial Accounting, Principles of Costing, Commerce, Economics, Business Management'
        }
      ],
      highlights: 'Modern chemistry and biology wet-labs, computer lab access for ICT electives, experienced WAEC examiners.'
    },
    {
      id: 'college',
      name: 'College & Higher Institute (Kambia 1 Campus)',
      levels: 'Higher National Diploma (HND) & Professional Certificates',
      ages: 'Tertiary Scholars & Adult Learners',
      color: 'amber',
      description: 'Tertiary educational division located in Kambia 1 offering career-ready diplomas, professional certificates, and teacher credentialing for students across the Northern Province.',
      programs: [
        'Higher National Diploma in Computer Science & ICT (2 Years)',
        'Diploma in Business Administration & Financial Management (2 Years)',
        'Diploma in Educational Leadership & School Pedagogy (2 Years)',
        'Certificate in Community Health & Development (1 Year)',
        'Professional Certificate in Accounting & Digital Spreadsheets (6 Months)'
      ],
      highlights: 'Evening and weekend modular schedules available for working professionals, internship placements in Kambia and Freetown.'
    }
  ];

  const filteredTiers = activeTier === 'all' 
    ? TIERS 
    : TIERS.filter(t => t.id === activeTier);

  return (
    <div className="space-y-12 pb-10" id="website-academics-page">
      {/* Banner */}
      <section className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-xl">
        <div className="max-w-3xl space-y-3">
          <span className="px-3 py-1 rounded-full bg-blue-800/80 text-blue-200 text-xs font-bold">
            Academic Excellence in Kambia 1
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Comprehensive Education from Early Childhood to College
          </h1>
          <p className="text-base text-slate-300 leading-relaxed font-normal">
            Givers World Mission Diplomats Academy & College offers structured, accredited academic pathways tailored to every developmental stage, from Nursery through WAEC Secondary Exams to Higher College Diplomas.
          </p>
        </div>
      </section>

      {/* Tier Filter Tabs */}
      <section className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          type="button"
          onClick={() => setActiveTier('all')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeTier === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Divisions (5 Tiers)
        </button>
        <button
          type="button"
          onClick={() => setActiveTier('nursery')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeTier === 'nursery'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Nursery & Kindergarten
        </button>
        <button
          type="button"
          onClick={() => setActiveTier('primary')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeTier === 'primary'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Primary School (NPSE)
        </button>
        <button
          type="button"
          onClick={() => setActiveTier('jss')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeTier === 'jss'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Junior Secondary (BECE)
        </button>
        <button
          type="button"
          onClick={() => setActiveTier('sss')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeTier === 'sss'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Senior Secondary (WASSCE)
        </button>
        <button
          type="button"
          onClick={() => setActiveTier('college')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
            activeTier === 'college'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          College Division (Higher Diplomas)
        </button>
      </section>

      {/* Tier Cards Grid */}
      <section className="space-y-6">
        {filteredTiers.map((tier) => (
          <div 
            key={tier.id}
            className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs hover:shadow-md transition-shadow"
            id={`academic-tier-${tier.id}`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-slate-100 text-slate-700">
                    {tier.levels}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    • {tier.ages}
                  </span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  {tier.name}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate('admissions')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Apply for {tier.name.split(' ')[0]}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed mb-6 font-normal">
              {tier.description}
            </p>

            {/* Subjects or Streams */}
            {tier.subjects && (
              <div className="mb-5">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2">
                  Key Subjects Taught
                </h4>
                <div className="flex flex-wrap gap-2">
                  {tier.subjects.map((sub, i) => (
                    <span 
                      key={i} 
                      className="px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700"
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {tier.streams && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                {tier.streams.map((stream, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100">
                    <h5 className="font-black text-purple-950 text-sm mb-1">{stream.name}</h5>
                    <p className="text-xs text-purple-800 leading-relaxed">{stream.courses}</p>
                  </div>
                ))}
              </div>
            )}

            {tier.programs && (
              <div className="mb-5 space-y-2">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2">
                  Accredited College Diplomas & Degree Programs
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {tier.programs.map((prog, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80">
                      <CheckCircle2 className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span className="text-xs font-bold text-slate-900">{prog}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Highlight Footer */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2 text-xs text-slate-600">
              <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span><strong>Excellence Factor:</strong> {tier.highlights}</span>
            </div>
          </div>
        ))}
      </section>

      {/* Classroom and Computer Lab Visual Teaser */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="h-56 rounded-2xl overflow-hidden">
            <img 
              src={classroomImg} 
              alt="Classroom learning at Givers World Mission Diplomats Academy in Kambia 1" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <h4 className="text-lg font-black text-slate-900">
            Interactive Classroom Instruction
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every classroom at our Kambia 1 campus is designed with spacious ventilation, ergonomic desks, and teacher whiteboards to foster active student engagement and debate.
          </p>
        </div>

        <div className="rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="h-56 rounded-2xl overflow-hidden bg-slate-900">
            <img 
              src={nurseryGradImg} 
              alt="Early childhood and nursery graduation in white robes at Givers World Mission in Kambia 1" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.opacity = '0.4';
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-black text-slate-900">
              Foundational & Nursery Graduations
            </h4>
            <span className="text-[10px] font-mono text-slate-400">IMG-20260918-WA0029.jpg</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Celebrating literacy and academic milestones from early childhood education in white cap and gown regalia to prepare pupils for primary entrance exams.
          </p>
        </div>
      </section>
    </div>
  );
}
