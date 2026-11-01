/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, ROLE_PRIVILEGES_MAP, DEMO_PRESET_USERS, testFirestoreConnection } from '../firebase';
import { UserRole, RolePrivileges, AuthUser } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole;
  privileges: RolePrivileges;
  isLoading: boolean;
  isFirebaseOnline: boolean;
  signInWithGoogle: () => Promise<void>;
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
  'nabieumelissajosephine@gmail.com'
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

  // Helper permission check
  const can = (permission: keyof Omit<RolePrivileges, 'role' | 'label' | 'description'>): boolean => {
    return Boolean(privileges[permission]);
  };

  // Test Firebase connection on boot
  useEffect(() => {
    testFirestoreConnection().then(online => {
      setIsFirebaseOnline(online);
    });
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Determine role: bootstrapped admin emails get 'admin'
        let assignedRole: UserRole = 'teacher';
        if (firebaseUser.email && BOOTSTRAPPED_ADMIN_EMAILS.includes(firebaseUser.email.toLowerCase())) {
          assignedRole = 'admin';
        } else {
          // Check local registry or Firestore
          const existing = userList.find(u => u.uid === firebaseUser.uid || u.email === firebaseUser.email);
          if (existing) {
            assignedRole = existing.role;
          } else {
            // Check Firestore doc if online
            try {
              const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
              if (userDoc.exists() && userDoc.data().role) {
                assignedRole = userDoc.data().role;
              }
            } catch (err) {
              console.warn('Could not read user profile from Firestore, using default:', err);
            }
          }
        }

        const authUserObj: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          photoURL: firebaseUser.photoURL,
          role: assignedRole,
        };

        setUser(authUserObj);

        // Update in-memory registry
        setUserList(prev => {
          const index = prev.findIndex(p => p.uid === authUserObj.uid);
          let updated: AuthUser[];
          if (index >= 0) {
            updated = [...prev];
            updated[index] = { ...updated[index], ...authUserObj };
          } else {
            updated = [...prev, authUserObj];
          }
          localStorage.setItem('sma_user_registry', JSON.stringify(updated));
          return updated;
        });

        // Save to Firestore if admin
        try {
          await setDoc(doc(db, 'users', firebaseUser.uid), {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            role: assignedRole,
            photoURL: firebaseUser.photoURL || '',
            createdAt: new Date().toISOString()
          }, { merge: true });
        } catch (e) {
          // Non-blocking in case of restricted write
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
    });

    return () => unsubscribe();
  }, []);

  // Google Sign In
  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Sign-in failed:', error);
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

  // Ensure public visitors start with clean unlocked session on fresh loads
  useEffect(() => {
    sessionStorage.removeItem('sma_session_locked');
    setIsSessionLocked(false);
    lastActivityRef.current = Date.now();
  }, []);

  // Function to lock session (only applicable when in portal)
  const lockSession = useCallback(() => {
    setIsSessionLocked(true);
    sessionStorage.setItem('sma_session_locked', 'true');
    setSecondsRemaining(0);
  }, []);

  // Function to unlock session
  const unlockSession = useCallback((roleToUnlock?: UserRole) => {
    if (roleToUnlock) {
      localStorage.setItem('sma_active_role', roleToUnlock);
      setUser(prev => {
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

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    if (!isSessionLocked) {
      lastActivityRef.current = Date.now();
      setSecondsRemaining(INACTIVITY_TIMEOUT_SECONDS);
    }
  }, [isSessionLocked]);

  // Global Inactivity Event Listeners (only locks if user is actively in the portal)
  useEffect(() => {
    const handleUserActivity = () => {
      if (isSessionLocked) return;
      const now = Date.now();
      // Throttle timestamp updates to at most once every 300ms
      if (now - lastActivityRef.current >= 300) {
        lastActivityRef.current = now;
        setSecondsRemaining(INACTIVITY_TIMEOUT_SECONDS);
      }
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click', 'wheel', 'input', 'pointerdown'];
    activityEvents.forEach(evt => {
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

    // Inactivity countdown & lock trigger interval (every 1 second)
    const interval = setInterval(() => {
      // If browsing public website, do not count down portal inactivity
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

      // Trigger automatic session lock when 1 minute of inactivity elapses inside portal
      if (remaining <= 0) {
        setIsSessionLocked(true);
        sessionStorage.setItem('sma_session_locked', 'true');
      }
    }, 1000);

    return () => {
      activityEvents.forEach(evt => {
        window.removeEventListener(evt, handleUserActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [isSessionLocked, isPortalActive]);

  // Sign Out
  const signOutUser = async () => {
    try {
      setIsLoading(true);
      await firebaseSignOut(auth);
      // Reset to default guest admin demo for testing and unlock session
      setUser(DEMO_PRESET_USERS.admin);
      localStorage.removeItem('sma_active_role');
      setIsSessionLocked(false);
      setIsPortalActiveRaw(false);
      sessionStorage.removeItem('sma_session_locked');
      setSecondsRemaining(INACTIVITY_TIMEOUT_SECONDS);
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick switch role (vital for demoing & testing all 5 privilege tiers in real-time)
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

  // Update a user's role (Admin Privilege feature)
  const updateUserRole = async (targetUserId: string, newRole: UserRole) => {
    if (!can('canManageUserRoles')) {
      console.warn('Unauthorized: Only Super Administrators can alter user roles.');
      return;
    }

    setUserList(prev => {
      const updated = prev.map(u => u.uid === targetUserId ? { ...u, role: newRole } : u);
      localStorage.setItem('sma_user_registry', JSON.stringify(updated));
      return updated;
    });

    // If updating currently logged in user
    if (user && user.uid === targetUserId) {
      setUser(prev => prev ? { ...prev, role: newRole } : null);
    }

    // Attempt Firestore persistence if possible
    try {
      await setDoc(doc(db, 'users', targetUserId), { role: newRole }, { merge: true });
    } catch (err) {
      console.warn('Firestore update role notification:', err);
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
