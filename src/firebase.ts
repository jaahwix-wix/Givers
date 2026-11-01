/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer,
  setDoc,
  getDoc,
  initializeFirestore
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { UserRole, RolePrivileges, AuthUser } from './types';

// Permanent embedded Firebase API Key for zero-prompt instant initialization
export const EMBEDDED_FIREBASE_API_KEY = 'AIzaSyBPczm2HxZHOXy6x_lbSHT-A4Zcm32lCv0';

// Initialize Firebase App with guaranteed embedded API key
const resolvedApiKey = 
  firebaseConfig.apiKey ||
  EMBEDDED_FIREBASE_API_KEY ||
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_API_KEY) ||
  (typeof process !== 'undefined' && (process.env?.VITE_FIREBASE_API_KEY || process.env?.FIREBASE_API_KEY)) ||
  'AIzaSyBPczm2HxZHOXy6x_lbSHT-A4Zcm32lCv0';

const activeFirebaseConfig = {
  ...firebaseConfig,
  apiKey: resolvedApiKey || EMBEDDED_FIREBASE_API_KEY,
};

const app = initializeApp(activeFirebaseConfig);

// CRITICAL: Firestore must be initialized with the database ID from config.
// Using experimentalForceLongPolling eliminates WebChannel streaming timeout and proxy buffering drops
// common in browser sandboxes, iframes, and corporate proxies.
export const db = typeof window !== 'undefined'
  ? initializeFirestore(app, {
      experimentalForceLongPolling: true,
    }, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Standard West African School Management Role Privileges Matrix
export const ROLE_PRIVILEGES_MAP: Record<UserRole, RolePrivileges> = {
  admin: {
    role: 'admin',
    label: 'Super Admin / Principal',
    description: 'Unrestricted administrative authority across all school modules and financial controls',
    canViewDashboard: true,
    canViewStudents: true,
    canManageStudents: true,
    canTakeAttendance: true,
    canManageDiscipline: true,
    canViewAcademics: true,
    canManageAcademics: true,
    canGenerateReportCards: true,
    canViewFinances: true,
    canManageFinances: true,
    canManageStaff: true,
    canManageBus: true,
    canManageLibrary: true,
    canBackupData: true,
    canManageUserRoles: true,
    canViewStudentPortal: true,
    canVerifyStaffAndStudents: true, // Only administrator
  },
  teacher: {
    role: 'teacher',
    label: 'Academic Teacher / Form Master',
    description: 'Academic management, marks entry, attendance, report cards, and student pastoral care',
    canViewDashboard: true,
    canViewStudents: true,
    canManageStudents: false, // Cannot delete or alter primary registry records
    canTakeAttendance: true,
    canManageDiscipline: true,
    canViewAcademics: true,
    canManageAcademics: true,
    canGenerateReportCards: true,
    canViewFinances: false, // Restricted from tuition financial data
    canManageFinances: false,
    canManageStaff: false,
    canManageBus: false,
    canManageLibrary: true,
    canBackupData: false,
    canManageUserRoles: false,
    canViewStudentPortal: false,
    canVerifyStaffAndStudents: false, // Restricted
  },
  bursar: {
    role: 'bursar',
    label: 'Bursar / Financial Officer',
    description: 'Tuition fees ledger, student payment receipts, expense vouchers, and bank deposits',
    canViewDashboard: true,
    canViewStudents: true,
    canManageStudents: false,
    canTakeAttendance: false,
    canManageDiscipline: false,
    canViewAcademics: false,
    canManageAcademics: false, // Cannot tamper with exam marks
    canGenerateReportCards: false,
    canViewFinances: true,
    canManageFinances: true,
    canManageStaff: false,
    canManageBus: false,
    canManageLibrary: false,
    canBackupData: false,
    canManageUserRoles: false,
    canViewStudentPortal: false,
    canVerifyStaffAndStudents: false, // Restricted
  },
  transport: {
    role: 'transport',
    label: 'Transportation & Logistics Officer',
    description: 'School bus fleet operations, routes, safety checks, and student commuter manifests',
    canViewDashboard: true,
    canViewStudents: true, // View student contact details & drop-off zones
    canManageStudents: false,
    canTakeAttendance: false,
    canManageDiscipline: false,
    canViewAcademics: false,
    canManageAcademics: false,
    canGenerateReportCards: false,
    canViewFinances: false,
    canManageFinances: false,
    canManageStaff: false,
    canManageBus: true,
    canManageLibrary: false,
    canBackupData: false,
    canManageUserRoles: false,
    canViewStudentPortal: false,
    canVerifyStaffAndStudents: false, // Restricted
  },
  student_parent: {
    role: 'student_parent',
    label: 'Student & Guardian Portal',
    description: 'Read-only access to personal terminal report cards, continuous assessments, and fee balances',
    canViewDashboard: false,
    canViewStudents: false,
    canManageStudents: false,
    canTakeAttendance: false,
    canManageDiscipline: false,
    canViewAcademics: false,
    canManageAcademics: false,
    canGenerateReportCards: false,
    canViewFinances: false,
    canManageFinances: false,
    canManageStaff: false,
    canManageBus: false,
    canManageLibrary: false,
    canBackupData: false,
    canManageUserRoles: false,
    canViewStudentPortal: true,
    canVerifyStaffAndStudents: false, // Restricted
  },
};

// System Accounts for Institutional Roles
export const DEMO_PRESET_USERS: Record<UserRole, AuthUser> = {
  admin: {
    uid: 'system_admin_01',
    email: 'jaahwix@gmail.com',
    displayName: 'Evangelist Saint Turay (CEO/Principal)',
    photoURL: null,
    role: 'admin',
    isCustomRole: true,
  },
  teacher: {
    uid: 'system_teacher_01',
    email: 'academic.staff@giversworldmission.edu.sl',
    displayName: 'Head of Academics (Faculty Lead)',
    photoURL: null,
    role: 'teacher',
    isCustomRole: true,
  },
  bursar: {
    uid: 'system_bursar_01',
    email: 'finance.bursar@giversworldmission.edu.sl',
    displayName: 'Mr. Alie Kamara (School Bursar)',
    photoURL: null,
    role: 'bursar',
    isCustomRole: true,
  },
  transport: {
    uid: 'system_transport_01',
    email: 'fleet.logistics@giversworldmission.edu.sl',
    displayName: 'Fleet & Logistics Coordinator',
    photoURL: null,
    role: 'transport',
    isCustomRole: true,
  },
  student_parent: {
    uid: 'system_parent_01',
    email: 'parent.portal@giversworldmission.edu.sl',
    displayName: 'Parent / Student Guardian Portal',
    photoURL: null,
    role: 'student_parent',
    isCustomRole: true,
  },
};

// Error handling specification conforming to Firebase skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (
      err?.code === 'unavailable' ||
      err?.code === 'deadline-exceeded' ||
      (typeof err?.message === 'string' && (
        err.message.includes('the client is offline') ||
        err.message.includes('unavailable') ||
        err.message.includes('could not be completed') ||
        err.message.includes('Could not reach Cloud Firestore')
      ))
    ) {
      console.warn('Firebase connection test: client offline or network unreachable. The client operates in offline mode.');
      return false;
    }
    // Any permission-denied indicates successful connection to the backend and rules evaluation
    return true;
  }
}
