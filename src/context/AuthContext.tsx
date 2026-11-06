/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';
import { testSupabaseConnection } from '../supabase';
import { ROLE_PRIVILEGES_MAP, DEMO_PRESET_USERS } from '../constants';
import { UserRole, RolePrivileges, AuthUser } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole;
  privileges: RolePrivileges;
  isLoading: boolean;
  isFirebaseOnline: boolean;
  isSupabaseOnline: boolean;
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
  'nabieumelissajosephine@gmail.com'
];
const INACTIVITY_TIMEOUT_SECONDS = 1800; // 30 minutes idle timeout

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirebaseOnline, setIsFirebaseOnline] = useState(false);
  const [isSupabaseOnline, setIsSupabaseOnline] = useState(false);
  
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

  // Test Supabase connection on boot and listen to credentials updates
  useEffect(() => {
    const checkSupabase = () => {
      testSupabaseConnection().then(res => {
        setIsSupabaseOnline(res.connected);
        setIsFirebaseOnline(res.connected); // Maintain compatibility
      });
    };
    checkSupabase();
    window.addEventListener('sma_supabase_config_changed', checkSupabase);
    return () => window.removeEventListener('sma_supabase_config_changed', checkSupabase);
  }, []);

  // Helper to process active Supabase Session
  const handleSupabaseSession = useCallback(async (sessionUser: any | null) => {
    if (sessionUser) {
      // Determine user role
      let assignedRole: UserRole = 'teacher';
      const userEmail = sessionUser.email ? sessionUser.email.toLowerCase() : '';

      if (userEmail && BOOTSTRAPPED_ADMIN_EMAILS.includes(userEmail)) {
        assignedRole = 'admin';
      } else if (sessionUser.user_metadata?.role) {
        assignedRole = sessionUser.user_metadata.role as UserRole;
      } else {
        // Check local accounts registry
        const existing = userList.find(u => u.uid === sessionUser.id || (u.email && u.email.toLowerCase() === userEmail));
        if (existing) {
          assignedRole = existing.role;
        } else {
          // Attempt checking Supabase users document
          try {
            const { data } = await supabase
              .from('school_documents')
              .select('data')
              .eq('collection', 'users')
              .eq('doc_id', sessionUser.id)
              .maybeSingle();

            if (data?.data?.role) {
              assignedRole = data.data.role;
            }
          } catch (err) {
            console.warn('[SupabaseAuth] Could not read role from Supabase:', err);
          }
        }
      }

      const authUserObj: AuthUser = {
        uid: sessionUser.id,
        email: sessionUser.email || null,
        displayName: 
          sessionUser.user_metadata?.full_name || 
          sessionUser.user_metadata?.name || 
          sessionUser.email?.split('@')[0] || 
          'Authenticated User',
        photoURL: sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.picture || null,
        role: assignedRole,
        isCustomRole: false
      };

      setUser(authUserObj);

      // Update in-memory registry
      setUserList(prev => {
        const index = prev.findIndex(p => p.uid === authUserObj.uid || (p.email && p.email === authUserObj.email));
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

      // Persist profile to Supabase users collection
      try {
        await supabase.from('school_documents').upsert({
          collection: 'users',
          doc_id: sessionUser.id,
          data: {
            id: sessionUser.id,
            email: sessionUser.email,
            displayName: authUserObj.displayName,
            role: assignedRole,
            photoURL: authUserObj.photoURL,
            updatedAt: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        }, { onConflict: 'collection,doc_id' });
      } catch {}
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
  }, [userList]);

  // Listen to Supabase Auth State
  useEffect(() => {
    // 1. Check existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSupabaseSession(session?.user ?? null);
    }).catch(err => {
      console.warn('[SupabaseAuth] getSession note:', err);
      handleSupabaseSession(null);
    });

    // 2. Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      handleSupabaseSession(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [handleSupabaseSession]);

  // Supabase Google OAuth Sign In
  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      if (error) {
        console.warn('[SupabaseAuth] OAuth notice:', error.message);
        // Fallback to demo account if OAuth is not configured yet on project
        setUser(DEMO_PRESET_USERS.admin);
      }
    } catch (error: any) {
      console.error('[SupabaseAuth] Sign-in failed:', error);
      setUser(DEMO_PRESET_USERS.admin);
    } finally {
      setIsLoading(false);
    }
  };

  // Supabase Email / Password Sign In
  const signInWithEmail = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      });
      if (error) throw error;
      if (data.user) {
        handleSupabaseSession(data.user);
      }
      return { success: true, user: data.user };
    } catch (error: any) {
      console.error('[SupabaseAuth] Email login error:', error);
      return { success: false, error: error.message || 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  // Supabase Email / Password Sign Up
  const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    try {
      setIsLoading(true);
      const isInitialAdmin = BOOTSTRAPPED_ADMIN_EMAILS.includes(email.trim().toLowerCase());
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: {
            full_name: displayName || email.split('@')[0],
            role: isInitialAdmin ? 'admin' : 'teacher'
          }
        }
      });
      if (error) throw error;
      if (data.user) {
        handleSupabaseSession(data.user);
      }
      return { success: true, user: data.user };
    } catch (error: any) {
      console.error('[SupabaseAuth] Email registration error:', error);
      return { success: false, error: error.message || 'Registration failed' };
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

  // Global Inactivity Event Listeners
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

    // Inactivity countdown & lock trigger interval
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
      activityEvents.forEach(evt => {
        window.removeEventListener(evt, handleUserActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [isSessionLocked, isPortalActive]);

  // Supabase Sign Out
  const signOutUser = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      // Reset to default guest admin demo for testing and unlock session
      setUser(DEMO_PRESET_USERS.admin);
      localStorage.removeItem('sma_active_role');
      setIsSessionLocked(false);
      setIsPortalActiveRaw(false);
      sessionStorage.removeItem('sma_session_locked');
      setSecondsRemaining(INACTIVITY_TIMEOUT_SECONDS);
    } catch (error) {
      console.error('[SupabaseAuth] Sign out error:', error);
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

    if (user && user.uid === targetUserId) {
      setUser(prev => prev ? { ...prev, role: newRole } : null);
    }

    // Persist role in Supabase
    try {
      await supabase.from('school_documents').upsert({
        collection: 'users',
        doc_id: targetUserId,
        data: { id: targetUserId, role: newRole, updatedAt: new Date().toISOString() },
        updated_at: new Date().toISOString()
      }, { onConflict: 'collection,doc_id' });
    } catch (err) {
      console.warn('[SupabaseAuth] Update role note:', err);
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
        isSupabaseOnline,
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
