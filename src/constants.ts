/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StudentClass, SSSStream, UniversityProgram } from './types';

export const CLASSES_LIST: StudentClass[] = [
  'Nursery 1', 'Nursery 2', 'Nursery 3',
  'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6',
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6',
  'JSS 1', 'JSS 2', 'JSS 3',
  'SSS 1', 'SSS 2', 'SSS 3',
  'University Year 1', 'University Year 2', 'University Year 3', 'University Year 4'
];

export type SchoolTier = 'Nursery' | 'Primary' | 'JSS' | 'SSS' | 'University';

export interface ClassGroup {
  tier: SchoolTier;
  label: string;
  badgeColor: string;
  classes: StudentClass[];
}

export const CLASS_GROUPS: ClassGroup[] = [
  {
    tier: 'Nursery',
    label: 'Nursery (Nursery 1 - 3)',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    classes: ['Nursery 1', 'Nursery 2', 'Nursery 3']
  },
  {
    tier: 'Primary',
    label: 'Primary School (Primary 1 - 6)',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    classes: ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6']
  },
  {
    tier: 'JSS',
    label: 'Junior Secondary (JSS 1 - 3)',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    classes: ['JSS 1', 'JSS 2', 'JSS 3']
  },
  {
    tier: 'SSS',
    label: 'Senior Secondary (SSS 1 - 3)',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    classes: ['SSS 1', 'SSS 2', 'SSS 3']
  },
  {
    tier: 'University',
    label: 'University (Year 1 - 4: Certificate & Diploma)',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    classes: ['University Year 1', 'University Year 2', 'University Year 3', 'University Year 4']
  }
];

export function getTierForClass(className?: string): SchoolTier {
  const c = className || '';
  if (c.startsWith('Nursery') || c.startsWith('Pre') || c.startsWith('Prep')) return 'Nursery';
  if (c.startsWith('Primary') || c.startsWith('Class')) return 'Primary';
  if (c.startsWith('JSS')) return 'JSS';
  if (c.startsWith('SSS')) return 'SSS';
  if (c.startsWith('University')) return 'University';
  return 'Primary';
}

export const UNIVERSITY_PROGRAMS: { id: UniversityProgram; label: string; description: string; duration: string }[] = [
  { 
    id: 'Certificate', 
    label: 'Certificate Program', 
    description: 'Foundational vocational, technical, or specialized higher education certificate', 
    duration: '1 - 2 Years' 
  },
  { 
    id: 'Diploma', 
    label: 'Diploma Program', 
    description: 'Undergraduate academic diploma conferring specialized professional qualification', 
    duration: '2 - 3 Years' 
  }
];

export const SSS_STREAMS: SSSStream[] = ['Science', 'Arts', 'Commercial', 'General'];

// Subject lists specific to Sierra Leone and Tertiary educational levels
export const LEVEL_SUBJECTS = {
  PRE_SCHOOL: [
    'Early Numeracy',
    'Early Literacy',
    'Phonics & Letter Sounds',
    'Sensory & Practical Life',
    'Creative Arts & Rhymes',
    'Health & Good Habits'
  ],
  NURSERY: [
    'Nursery Numeracy & Shapes',
    'Language Development & Phonics',
    'Pre-Writing Skills',
    'Social & Emotional Habits',
    'Practical Life & Motor Skills',
    'Creative Arts & Storytelling',
    'Physical Play & Health'
  ],
  PRIMARY: [
    'English Language',
    'Mathematics',
    'General Science',
    'Social Studies',
    'Agricultural Science',
    'Home Economics',
    'Physical & Health Education',
    'Quantitative Aptitude',
    'Verbal Aptitude',
    'Creative & Practical Arts'
  ],
  JSS: [
    'Language Arts (English)',
    'Mathematics',
    'Integrated Science',
    'Social Studies',
    'Agricultural Science',
    'Home Economics',
    'Business Studies',
    'Religious & Moral Education (RME)',
    'Physical Health Education (PHE)',
    'French'
  ],
  SSS_SCIENCE: [
    'English Language',
    'Mathematics (Core)',
    'Biology',
    'Chemistry',
    'Physics',
    'Further Mathematics',
    'Geography',
    'Civic Education',
    'Agricultural Science'
  ],
  SSS_ARTS: [
    'English Language',
    'Mathematics (Core)',
    'Literature in English',
    'Government',
    'History',
    'Christian Religious Studies (CRS) / Islamic Studies (ISS)',
    'Krio / French',
    'Civic Education',
    'Economics'
  ],
  SSS_COMMERCIAL: [
    'English Language',
    'Mathematics (Core)',
    'Financial Accounting',
    'Commerce',
    'Economics',
    'Business Management',
    'Office Practice',
    'Civic Education',
    'Geography'
  ],
  UNIVERSITY_GENERAL: [
    'Research Methodology & Academic Writing',
    'Digital Technology & Data Literacy',
    'Critical Thinking & Logic',
    'Applied Statistics & Quantitative Methods',
    'Communication & Public Rhetoric',
    'Leadership, Ethics & Governance',
    'Entrepreneurship & Innovation'
  ],
  UNIVERSITY_SCIENCE: [
    'Advanced Research & Quantitative Analysis',
    'Computer Systems & Software Design',
    'Applied Data Science & Statistics',
    'Applied Science & Environmental Systems',
    'Technical Report Writing',
    'Science Policy & Professional Ethics',
    'Specialized Laboratory Practicum'
  ],
  UNIVERSITY_COMMERCIAL: [
    'Corporate Finance & Investment Analysis',
    'Strategic Management & Leadership',
    'Managerial Accounting & Auditing',
    'Econometrics & Market Analytics',
    'Commercial Law & Corporate Governance',
    'Business Decision Modeling'
  ],
  UNIVERSITY_ARTS: [
    'International Relations & Diplomacy',
    'Public Policy & Administrative Law',
    'Advanced Literature & Critical Discourse',
    'African History & Global Development',
    'Applied Sociological Field Research',
    'Professional Ethics & Civic Leadership'
  ],
  UNIVERSITY_CERTIFICATE: [
    'Fundamentals of Information Technology',
    'Applied Business Communication & Technical Writing',
    'Introduction to Management & Entrepreneurship',
    'Applied Mathematics & Quantitative Problem Solving',
    'Digital Workplace Productivity Tools',
    'Professional Ethics & Civic Leadership',
    'Practical Vocational Practicum & Capstone'
  ],
  UNIVERSITY_DIPLOMA: [
    'Advanced Research Methodology & Academic Inquiry',
    'Strategic Organizational Leadership & Management',
    'Applied Information Systems & Database Technologies',
    'Financial Accounting, Auditing & Resource Control',
    'Public Administration, Policy & Administrative Law',
    'Professional Internship Practicum & Project Thesis',
    'Specialized Professional Studies & Fieldwork'
  ]
};

export function getSubjectsForClass(
  className?: StudentClass, 
  stream?: SSSStream, 
  universityProgram?: UniversityProgram
): string[] {
  const c = className || '';
  if (c.startsWith('Pre') || c.startsWith('Prep') || c.startsWith('Nursery')) {
    return LEVEL_SUBJECTS.NURSERY;
  }
  if (c.startsWith('Primary') || c.startsWith('Class')) {
    return LEVEL_SUBJECTS.PRIMARY;
  }
  if (c.startsWith('JSS')) {
    return LEVEL_SUBJECTS.JSS;
  }
  if (c.startsWith('University')) {
    if (universityProgram === 'Certificate') {
      return LEVEL_SUBJECTS.UNIVERSITY_CERTIFICATE;
    }
    if (universityProgram === 'Diploma') {
      return LEVEL_SUBJECTS.UNIVERSITY_DIPLOMA;
    }
    if (stream === 'Science') return LEVEL_SUBJECTS.UNIVERSITY_SCIENCE;
    if (stream === 'Commercial') return LEVEL_SUBJECTS.UNIVERSITY_COMMERCIAL;
    if (stream === 'Arts') return LEVEL_SUBJECTS.UNIVERSITY_ARTS;
    return LEVEL_SUBJECTS.UNIVERSITY_DIPLOMA;
  }
  // SSS classes
  if (stream === 'Science') {
    return LEVEL_SUBJECTS.SSS_SCIENCE;
  }
  if (stream === 'Arts') {
    return LEVEL_SUBJECTS.SSS_ARTS;
  }
  if (stream === 'Commercial') {
    return LEVEL_SUBJECTS.SSS_COMMERCIAL;
  }
  return LEVEL_SUBJECTS.SSS_SCIENCE; // Default
}

// Sierra Leone Grading Standards (WAEC / West African Standard)
export interface GradeScale {
  minScore: number;
  grade: string;
  remark: string;
  isCredit: boolean;
  color: string;
}

export const SECONDARY_GRADING_SCALE: GradeScale[] = [
  { minScore: 91, grade: 'A', remark: 'Excellent', isCredit: true, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { minScore: 81, grade: 'B', remark: 'Very Good', isCredit: true, color: 'text-teal-600 bg-teal-50 border-teal-200' },
  { minScore: 75, grade: 'C', remark: 'Credit', isCredit: true, color: 'text-sky-600 bg-sky-50 border-sky-200' },
  { minScore: 0, grade: 'F', remark: 'Fail', isCredit: false, color: 'text-rose-600 bg-rose-50 border-rose-200' }
];

export const WAEC_GRADING_SCALE = SECONDARY_GRADING_SCALE;

export const PRIMARY_GRADING_SCALE: GradeScale[] = [
  { minScore: 91, grade: 'A', remark: 'Excellent', isCredit: true, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { minScore: 81, grade: 'B', remark: 'Very Good', isCredit: true, color: 'text-teal-600 bg-teal-50 border-teal-200' },
  { minScore: 65, grade: 'C', remark: 'Credit', isCredit: true, color: 'text-sky-600 bg-sky-50 border-sky-200' },
  { minScore: 0, grade: 'F', remark: 'Fail', isCredit: false, color: 'text-rose-600 bg-rose-50 border-rose-200' }
];

export const UNIVERSITY_GRADING_SCALE: GradeScale[] = [
  { minScore: 80, grade: 'A', remark: 'First Class Honors (GPA 4.0)', isCredit: true, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { minScore: 70, grade: 'B+', remark: 'Second Class Upper (GPA 3.5)', isCredit: true, color: 'text-teal-600 bg-teal-50 border-teal-200' },
  { minScore: 60, grade: 'B', remark: 'Second Class Lower (GPA 3.0)', isCredit: true, color: 'text-sky-600 bg-sky-50 border-sky-200' },
  { minScore: 50, grade: 'C', remark: 'Third Class / Pass (GPA 2.0)', isCredit: true, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  { minScore: 45, grade: 'D', remark: 'Pass (GPA 1.5)', isCredit: false, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { minScore: 0, grade: 'F', remark: 'Fail (GPA 0.0)', isCredit: false, color: 'text-rose-600 bg-rose-50 border-rose-200' }
];

export function getGradingScale(className?: StudentClass): GradeScale[] {
  const c = className || '';
  if (c.startsWith('University')) {
    return UNIVERSITY_GRADING_SCALE;
  }
  if (
    c.startsWith('Pre') || 
    c.startsWith('Prep') || 
    c.startsWith('Nursery') || 
    c.startsWith('Primary') || 
    c.startsWith('Class')
  ) {
    return PRIMARY_GRADING_SCALE;
  }
  return SECONDARY_GRADING_SCALE;
}

export function calculateGrade(score: number, className: StudentClass): { grade: string; remark: string; color: string } {
  const scale = getGradingScale(className);
  const matched = scale.find(s => score >= s.minScore);
  if (matched) {
    return { grade: matched.grade, remark: matched.remark, color: matched.color };
  }
  return { grade: 'F', remark: 'Fail', color: 'text-rose-600 bg-rose-50 border-rose-200' };
}
