/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type StudentClass =
  | 'Nursery 1' | 'Nursery 2' | 'Nursery 3'
  | 'Primary 1' | 'Primary 2' | 'Primary 3' | 'Primary 4' | 'Primary 5' | 'Primary 6'
  | 'Class 1' | 'Class 2' | 'Class 3' | 'Class 4' | 'Class 5' | 'Class 6'
  | 'JSS 1' | 'JSS 2' | 'JSS 3'
  | 'SSS 1' | 'SSS 2' | 'SSS 3'
  | 'University Year 1' | 'University Year 2' | 'University Year 3' | 'University Year 4'
  | 'Pre 1' | 'Pre 2' | 'Pre 3'
  | 'Prep 1' | 'Prep 2' | 'Prep 3'
  | 'University';

export type SSSStream = 'Science' | 'Arts' | 'Commercial' | 'General';

export type UniversityProgram = 'Certificate' | 'Diploma';

export interface Student {
  id: string;
  name: string;
  admissionNumber: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female';
  currentClass: StudentClass;
  stream?: SSSStream;
  universityProgram?: UniversityProgram; // Required for university students ('Certificate' | 'Diploma')
  classSection?: string; // e.g. "A", "B"
  parentName: string;
  parentPhone: string;
  address: string;
  enrollmentYear: number;
  status: 'Active' | 'Transferred' | 'Graduated';
  profileColor?: string;
  profileImage?: string;
  allergies?: string;
  bloodType?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  parentAccessCode?: string; // Auto-generated code for Parent Portal access (e.g. PAR-8492)
  studentAccessCode?: string; // Auto-generated code for Student Portal access
  verified?: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface SubjectGrade {
  id: string;
  subject: string;
  caScore: number; // Continuous Assessment (out of 30 or 40)
  examScore: number; // Exam (out of 70 or 60)
  totalScore: number; // caScore + examScore (out of 100)
  grade: string; // A1, B2, B3, C4, C5, C6, D7, E8, F9
  remark: string; // Excellent, Credit, Pass, Fail, etc.
}

export interface TermPerformance {
  grades: SubjectGrade[];
  teacherRemarks: string;
  principalRemarks: string;
  conduct: string; // Excellent, Satisfactory, etc.
  attendance: {
    totalDays: number;
    presentDays: number;
  };
}

export interface StudentAcademicRecord {
  studentId: string;
  academicYear: string; // e.g., "2025/2026"
  terms: {
    1: TermPerformance;
    2: TermPerformance;
    3: TermPerformance;
  };
}

export interface NationalExamPrep {
  studentId: string;
  examType: 'NPSE' | 'BECE' | 'WASSCE';
  registered: boolean;
  indexNumber?: string;
  subjectsScores: Array<{
    subject: string;
    mockScore: number; // Out of 100
    grade: string;
    status: 'Ready' | 'Review Needed' | 'Critical';
  }>;
  totalScore?: number; // Sum for NPSE, or count of credits for BECE/WASSCE
  recommendation: string;
}

export interface FeeTransaction {
  id: string;
  date: string;
  amount: number;
  paymentMethod: 'Bank Deposit' | 'Orange Money' | 'Africell Money' | 'Cash';
  receiptNumber: string;
}

export interface StudentFeeLedger {
  studentId: string;
  academicYear: string;
  terms: {
    [term: number]: {
      totalDue: number;
      paidAmount: number;
      balance: number;
      status: 'Paid' | 'Partial' | 'Unpaid';
      transactions: FeeTransaction[];
    };
  };
}

export interface ClassPerformanceSummary {
  className: StudentClass;
  totalStudents: number;
  averageScore: number;
  passRate: number; // Percentage
  topStudentName: string;
}

export type UserRole = 'admin' | 'teacher' | 'bursar' | 'transport' | 'student_parent';

export interface RolePrivileges {
  role: UserRole;
  label: string;
  description: string;
  canViewDashboard: boolean;
  canViewStudents: boolean;
  canManageStudents: boolean; // Register, edit personal details, delete
  canTakeAttendance: boolean; // Mark attendance
  canManageDiscipline: boolean; // Log disciplinary cases
  canViewAcademics: boolean; // View scores & grade entry
  canManageAcademics: boolean; // Enter & modify continuous assessments & exam marks
  canGenerateReportCards: boolean; // Produce terminal report cards
  canViewFinances: boolean; // View fee collections, financial metrics
  canManageFinances: boolean; // Record fee payments, log school expenses
  canManageStaff: boolean; // Staff profiles, subject assignments, payroll
  canManageBus: boolean; // Manage routes, buses, driver allocation
  canManageLibrary: boolean; // Manage book inventory, lending/returns
  canBackupData: boolean; // System backup & restore, core configs
  canManageUserRoles: boolean; // Manage user accounts and privilege assignments
  canViewStudentPortal: boolean; // Student/Parent personal academic and fee tracking
  canVerifyStaffAndStudents: boolean; // Strictly restricted: verify staff & student records (Principal/Admin only)
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  isCustomRole?: boolean;
}

export interface Teacher {
  id: string;
  staffId?: string;
  name: string;
  email: string;
  phone: string;
  roleTitle?: string;
  designation?: string;
  department?: string;
  bloodType?: string;
  profileImage?: string;
  subjects: string[];
  classes: StudentClass[];
  salary: number;
  hireDate: string;
  payrollStatus: 'Paid' | 'Pending' | 'Unpaid';
  accessCode?: string; // Auto-generated code for Teacher Portal access (e.g. TCH-3918)
  avatarColor?: string;
  verified?: boolean;
  isVerified?: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface Assignment {
  id: string;
  teacherId: string;
  teacherName: string;
  title: string;
  description: string;
  subject: string;
  className: StudentClass;
  dueDate: string;
  maxPoints: number;
  createdAt: string;
  attachmentName?: string;
  attachmentSize?: string;
  attachmentUrl?: string;
  attachmentType?: string;
  attachmentData?: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  className: StudentClass;
  submittedAt: string;
  textResponse: string;
  fileName: string;
  fileSize: string;
  fileUrl?: string;
  fileData?: string;
  status: 'Pending' | 'Graded';
  score?: number;
  feedback?: string;
}

export interface SchoolAnnouncement {
  id: string;
  title: string;
  message: string;
  date: string;
  priority: 'urgent' | 'normal';
  author: string;
  category?: 'fee' | 'academic' | 'transport' | 'administrative';
}

export interface PrincipalsNotice {
  id: string;
  title: string;
  content: string;
  author: string;
  role: string;
  date: string;
  isPinned: boolean;
  priority: 'High Priority' | 'Urgent Executive Order' | 'Official Directive';
  category: string;
  lastUpdated?: string;
}

export interface NotificationAlert {
  id: string;
  type: 'fee' | 'assignment' | 'announcement';
  title: string;
  description: string;
  timestamp: string;
  priority: 'urgent' | 'high' | 'medium' | 'normal';
  read: boolean;
  linkTab?: string;
  linkArgs?: any;
}

export interface FeeSmsAlertRecord {
  id: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  currentClass: StudentClass;
  guardianName: string;
  guardianPhone: string;
  term: number;
  balance: number;
  totalDue: number;
  messageText: string;
  sentAt: string;
  status: 'Delivered' | 'Pending' | 'Failed';
  channel: 'SMS' | 'WhatsApp';
}

export interface ClassNotice {
  id: string;
  title: string;
  content: string;
  author: string;
  authorRole: 'admin' | 'teacher';
  authorEmail?: string;
  targetClass: StudentClass | 'All Classes';
  priority: 'Urgent Executive Order' | 'Official Directive' | 'High Priority' | 'Standard Academic Notice';
  category: 'Academic' | 'Exam Preparation' | 'Discipline' | 'Attendance' | 'Event' | 'General' | 'Tuition';
  isPinned?: boolean;
  createdAt: string;
  date: string;
  smsBroadcast: {
    totalRecipients: number;
    studentCount: number;
    parentCount: number;
    deliveredCount: number;
    status: 'Delivered' | 'Broadcasting' | 'Failed';
    sentAt: string;
    carrier: string;
  };
}

export interface NoticeSmsLog {
  id: string;
  noticeId: string;
  noticeTitle: string;
  studentId: string;
  studentName: string;
  currentClass: StudentClass;
  recipientType: 'Student' | 'Parent/Guardian';
  recipientName: string;
  phoneNumber: string;
  messageText: string;
  carrier: string;
  status: 'Delivered' | 'Transmitted' | 'Pending';
  timestamp: string;
}


