/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import {
  auth,
  googleProvider,
  db,
  ROLE_PRIVILEGES_MAP,
  DEMO_PRESET_USERS,
  testFirestoreConnection,
} from '../firebase';
import { UserRole, RolePrivileges, AuthUser } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole;
  privileges: RolePrivileges;
  isLoading: boolean;
  isFirebaseOnline: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail?: (email: string, password: string) => Promise<{ success: boolean; user?: any; error?: string }>;
  signUpWithEmail?: (email: string, password: string, displayName?: string) => Promise<{ success: boolean; user?: any; error?: string }>;
  signOutUser: () => Promise<void>;
  switchRole: (role: UserRole) => void;
  updateUserRole: (targetUserId: string, newRole: UserRole) => Promise<void>;
  userList: AuthUser[];
  can: (permission: keyof Omit<RolePrivileges, 'role' | 'label' | 'description'>) => boolean;
  isSessionLocked: boolean;
  secondsRemaining: number;
  lockSession: () => void;
  unlockSession: (role?: UserRole) => void;
  resetInactivityTimer: () => void;
  isPortalActive: boolean;
  setPortalActive: (active: boolean) => void;
}

const BOOTSTRAPPED_ADMIN_EMAILS = [
  'jaahwix@gmail.com',
  'nabieumelissajosephine@gmail.com',
];
const INACTIVITY_TIMEOUT_SECONDS = 1800; // 30 minutes idle timeout

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirebaseOnline, setIsFirebaseOnline] = useState(false);

  // Stored registry of system accounts
  const [userList, setUserList] = useState<AuthUser[]>(() => {
    const saved = localStorage.getItem('sma_user_registry');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse user registry', e);
      }
    }
    return Object.values(DEMO_PRESET_USERS);
  });

  // Current active role derived from user or fallback to admin
  const currentRole: UserRole = user?.role || 'admin';
  const privileges: RolePrivileges = ROLE_PRIVILEGES_MAP[currentRole];

  const can = (permission: keyof Omit<RolePrivileges, 'role' | 'label' | 'description'>): boolean => {
    return Boolean(privileges[permission]);
  };

  // Test Firebase Cloud Firestore connection on boot and refresh requests
  useEffect(() => {
    const checkFirebase = () => {
      testFirestoreConnection()
        .then((connected) => {
          setIsFirebaseOnline(connected);
        })
        .catch(() => {
          setIsFirebaseOnline(false);
        });
    };
    checkFirebase();
    window.addEventListener('sma_firebase_config_changed', checkFirebase);
    return () => window.removeEventListener('sma_firebase_config_changed', checkFirebase);
  }, []);

  // Process active Firebase Auth session
  const handleFirebaseSession = useCallback(async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      let assignedRole: UserRole = 'teacher';
      const userEmail = firebaseUser.email ? firebaseUser.email.toLowerCase() : '';

      if (userEmail && BOOTSTRAPPED_ADMIN_EMAILS.includes(userEmail)) {
        assignedRole = 'admin';
      } else {
        // Attempt checking Firestore users collection
        try {
          const userSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data?.role && ROLE_PRIVILEGES_MAP[data.role as UserRole]) {
              assignedRole = data.role as UserRole;
            }
          } else {
            const existing = userList.find(
              (u) => u.uid === firebaseUser.uid || (u.email && u.email.toLowerCase() === userEmail)
            );
            if (existing) {
              assignedRole = existing.role;
            }
          }
        } catch (err) {
          console.warn('[FirebaseAuth] Could not read role from Firestore:', err);
        }
      }

      const authUserObj: AuthUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || null,
        displayName:
          firebaseUser.displayName ||
          firebaseUser.email?.split('@')[0] ||
          'Authenticated User',
        photoURL: firebaseUser.photoURL || null,
        role: assignedRole,
        isCustomRole: false,
      };

      setUser(authUserObj);

      // Update in-memory registry
      setUserList((prev) => {
        const index = prev.findIndex(
          (p) => p.uid === authUserObj.uid || (p.email && p.email === authUserObj.email)
        );
        let updated: AuthUser[];
        if (index >= 0) {
          updated = [...prev];
          updated[index] = { ...updated[index], ...authUserObj };
        } else {
          updated = [...prev, authUserObj];
        }
        try {
          localStorage.setItem('sma_user_registry', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      // Persist profile to Firestore users collection (compliant with firestore.rules isValidUserProfile)
      try {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const existingSnap = await getDoc(userRef);
        const optionalPhoto = authUserObj.photoURL ? { photoURL: authUserObj.photoURL } : {};
        if (existingSnap.exists()) {
          await updateDoc(userRef, {
            displayName: authUserObj.displayName,
            ...optionalPhoto,
          });
        } else {
          await setDoc(userRef, {
            id: firebaseUser.uid,
            email: firebaseUser.email || `${firebaseUser.uid}@giversworldmission.edu.sl`,
            displayName: authUserObj.displayName,
            role: assignedRole,
            createdAt: new Date().toISOString(),
            ...optionalPhoto,
          });
        }
      } catch (err) {
        console.warn('[FirebaseAuth] Could not sync profile to Firestore:', err);
      }
    } else {
      // Fallback to active demo account stored in localStorage or default to Super Admin
      const cachedDemoRole = localStorage.getItem('sma_active_role') as UserRole;
      if (cachedDemoRole && DEMO_PRESET_USERS[cachedDemoRole]) {
        setUser(DEMO_PRESET_USERS[cachedDemoRole]);
      } else {
        setUser(DEMO_PRESET_USERS.admin);
      }
    }
    setIsLoading(false);
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      handleFirebaseSession(firebaseUser);
    });
    return () => unsubscribe();
  }, [handleFirebaseSession]);

  // Firebase Google OAuth Sign In (using popup per iframe environment constraints)
  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await handleFirebaseSession(result.user);
      }
    } catch (error: any) {
      console.warn('[FirebaseAuth] Google sign-in note:', error?.message || error);
      // Fallback to demo admin account if popup was blocked/cancelled in preview
      if (!auth.currentUser) {
        setUser(DEMO_PRESET_USERS.admin);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Firebase Email / Password Sign In
  const signInWithEmail = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password.trim());
      if (credential.user) {
        await handleFirebaseSession(credential.user);
      }
      return { success: true, user: credential.user };
    } catch (error: any) {
      console.error('[FirebaseAuth] Email login error:', error);
      return { success: false, error: error?.message || 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  // Firebase Email / Password Sign Up
  const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    try {
      setIsLoading(true);
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password.trim());
      if (credential.user) {
        if (displayName) {
          await updateProfile(credential.user, { displayName });
        }
        await handleFirebaseSession(credential.user);
      }
      return { success: true, user: credential.user };
    } catch (error: any) {
      console.error('[FirebaseAuth] Email registration error:', error);
      return { success: false, error: error?.message || 'Registration failed' };
    } finally {
      setIsLoading(false);
    }
  };

  // Portal Active State (public website vs management portal)
  const [isPortalActive, setIsPortalActiveRaw] = useState<boolean>(false);

  const handleSetPortalActive = useCallback((active: boolean) => {
    setIsPortalActiveRaw(active);
    if (active) {
      setIsSessionLocked(false);
      sessionStorage.removeItem('sma_session_locked');
      lastActivityRef.current = Date.now();
      setSecondsRemaining(INACTIVITY_TIMEOUT_SECONDS);
    }
  }, []);

  // Inactivity & Session Lock State - always unlocked by default for public visitors
  const [isSessionLocked, setIsSessionLocked] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(INACTIVITY_TIMEOUT_SECONDS);
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    sessionStorage.removeItem('sma_session_locked');
    setIsSessionLocked(false);
    lastActivityRef.current = Date.now();
  }, []);

  const lockSession = useCallback(() => {
    setIsSessionLocked(true);
    sessionStorage.setItem('sma_session_locked', 'true');
    setSecondsRemaining(0);
  }, []);

  const unlockSession = useCallback((roleToUnlock?: UserRole) => {
    if (roleToUnlock) {
      localStorage.setItem('sma_active_role', roleToUnlock);
      setUser((prev) => {
        if (prev) {
          return {
            ...prev,
            role: roleToUnlock,
            displayName: prev.displayName || DEMO_PRESET_USERS[roleToUnlock].displayName,
          };
        }
        return DEMO_PRESET_USERS[roleToUnlock];
      });
    }
    setIsSessionLocked(false);
    sessionStorage.removeItem('sma_session_locked');
    lastActivityRef.current = Date.now();
    setSecondsRemaining(INACTIVITY_TIMEOUT_SECONDS);
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (!isSessionLocked) {
      lastActivityRef.current = Date.now();
      setSecondsRemaining(INACTIVITY_TIMEOUT_SECONDS);
    }
  }, [isSessionLocked]);

  useEffect(() => {
    const handleUserActivity = () => {
      if (isSessionLocked) return;
      const now = Date.now();
      if (now - lastActivityRef.current >= 300) {
        lastActivityRef.current = now;
        setSecondsRemaining(INACTIVITY_TIMEOUT_SECONDS);
      }
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click', 'wheel', 'input', 'pointerdown'];
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isPortalActive && !isSessionLocked) {
        const now = Date.now();
        const elapsed = Math.floor((now - lastActivityRef.current) / 1000);
        if (elapsed >= INACTIVITY_TIMEOUT_SECONDS) {
          setIsSessionLocked(true);
          sessionStorage.setItem('sma_session_locked', 'true');
          setSecondsRemaining(0);
        } else {
          setSecondsRemaining(Math.max(0, INACTIVITY_TIMEOUT_SECONDS - elapsed));
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const interval = setInterval(() => {
      if (!isPortalActive) {
        setSecondsRemaining(INACTIVITY_TIMEOUT_SECONDS);
        return;
      }

      if (isSessionLocked) {
        setSecondsRemaining(0);
        return;
      }

      const now = Date.now();
      const elapsedSeconds = Math.floor((now - lastActivityRef.current) / 1000);
      const remaining = Math.max(0, INACTIVITY_TIMEOUT_SECONDS - elapsedSeconds);
      setSecondsRemaining(remaining);

      if (remaining <= 0) {
        setIsSessionLocked(true);
        sessionStorage.setItem('sma_session_locked', 'true');
      }
    }, 1000);

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [isSessionLocked, isPortalActive]);

  const signOutUser = async () => {
    try {
      setIsLoading(true);
      await firebaseSignOut(auth);
      setUser(DEMO_PRESET_USERS.admin);
      localStorage.removeItem('sma_active_role');
      setIsSessionLocked(false);
      setIsPortalActiveRaw(false);
      sessionStorage.removeItem('sma_session_locked');
      setSecondsRemaining(INACTIVITY_TIMEOUT_SECONDS);
    } catch (error) {
      console.error('[FirebaseAuth] Sign out error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = (newRole: UserRole) => {
    localStorage.setItem('sma_active_role', newRole);
    if (user) {
      setUser({
        ...user,
        role: newRole,
        displayName: user.displayName || DEMO_PRESET_USERS[newRole].displayName,
      });
    } else {
      setUser(DEMO_PRESET_USERS[newRole]);
    }
  };

  const updateUserRole = async (targetUserId: string, newRole: UserRole) => {
    if (!can('canManageUserRoles')) {
      console.warn('Unauthorized: Only Super Administrators can alter user roles.');
      return;
    }

    const targetAccount = userList.find((u) => u.uid === targetUserId);
    setUserList((prev) => {
      const updated = prev.map((u) => (u.uid === targetUserId ? { ...u, role: newRole } : u));
      localStorage.setItem('sma_user_registry', JSON.stringify(updated));
      return updated;
    });

    if (user && user.uid === targetUserId) {
      setUser((prev) => (prev ? { ...prev, role: newRole } : null));
    }

    if (auth.currentUser) {
      try {
        await setDoc(
          doc(db, 'users', targetUserId),
          {
            id: targetUserId,
            email: targetAccount?.email || `${targetUserId}@giversworldmission.edu.sl`,
            role: newRole,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('[FirebaseAuth] Update role note:', err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: currentRole,
        privileges,
        isLoading,
        isFirebaseOnline,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOutUser,
        switchRole,
        updateUserRole,
        userList,
        can,
        isSessionLocked,
        secondsRemaining,
        lockSession,
        unlockSession,
        resetInactivityTimer,
        isPortalActive,
        setPortalActive: handleSetPortalActive,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
