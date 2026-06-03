/**
 * ============================================
 * This Area Of Code Is: Module Imports & Type Definitions
 * ============================================
 *
 * Explanation:
 * Imports React context API, Supabase auth client, and defines TypeScript
 * interfaces for NTCC-specific user roles, auth state, and profile data.
 * This context provides authentication state and user management across
 * the entire NTCC Music App component tree.
 *
 * In Other Words:
 * This is the "ID badge system" — it knows who's logged in, what role
 * they have (worship leader, musician, admin, etc.), and whether they're
 * allowed to access certain features.
 * ============================================
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { supabase } from "../main";
import type { User, Session, AuthError } from "@supabase/supabase-js";

// ─── NTCC Role Types ───
export type NTCCRole =
  | "worship_leader"
  | "musician"
  | "admin"
  | "conductor"
  | "sound_engineer"
  | "viewer";

// ─── User Profile (extends Supabase User) ───
export interface NTCCProfile {
  id: string;
  email: string;
  fullName: string;
  role: NTCCRole;
  churchId: string | null;
  instrument: string | null;
  voicePart: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Auth State ───
export interface AuthState {
  user: User | null;
  profile: NTCCProfile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: AuthError | null;
}

// ─── Auth Context Value ───
export interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, profileData: Partial<NTCCProfile>) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<NTCCProfile>) => Promise<void>;
  hasRole: (roles: NTCCRole[]) => boolean;
  refreshSession: () => Promise<void>;
}

/**
 * ============================================
 * This Area Of Code Is: Default Context Value
 * ============================================
 *
 * Explanation:
 * Creates the React context with default no-op functions and empty state.
 * This ensures TypeScript safety and prevents undefined errors when
 * components consume the context outside of the provider.
 *
 * In Other Words:
 * This is the "blank template" — sets up the structure before any real
 * data gets loaded.
 * ============================================
 */

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  updateProfile: async () => {},
  hasRole: () => false,
  refreshSession: async () => {},
});

/**
 * ============================================
 * This Area Of Code Is: Auth Hook
 * ============================================
 *
 * Explanation:
 * Custom React hook that provides convenient access to the AuthContext.
 * Throws an error if used outside of AuthProvider to prevent silent failures.
 *
 * In Other Words:
 * This is the "quick access button" — lets any component say "hey, who
 * am I?" and get the answer without writing boilerplate.
 * ============================================
 */

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/**
 * ============================================
 * This Area Of Code Is: Auth Provider Component
 * ============================================
 *
 * Explanation:
 * The main provider component that wraps the app and manages all auth state.
 * Handles Supabase auth events (sign in, sign out, session refresh),
 * fetches user profiles from the database, and exposes auth methods
 * to child components.
 *
 * In Other Words:
 * This is the "security office" — it watches for login/logout events,
 * keeps track of who's on duty, and hands out access badges.
 * ============================================
 */

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  // ─── State ───
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<NTCCProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  // ─── Derived State ───
  const isAuthenticated = !!user && !!session;

  /**
   * ============================================
   * This Area Of Code Is: Profile Fetcher
   * ============================================
   *
   * Explanation:
   * Fetches the NTCC user profile from Supabase database based on the
   * authenticated user's ID. Profiles are stored in the 'profiles' table
   * with Row Level Security ensuring users can only read their own data.
   *
   * In Other Words:
   * This is the "personnel file lookup" — goes to the database cabinet
   * and pulls the folder for whoever just logged in.
   * ============================================
   */

  const fetchProfile = useCallback(async (userId: string): Promise<NTCCProfile | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (fetchError) {
        console.error("Profile fetch error:", fetchError);
        return null;
      }

      if (data) {
        const ntccProfile: NTCCProfile = {
          id: data.id,
          email: data.email,
          fullName: data.full_name,
          role: data.role as NTCCRole,
          churchId: data.church_id,
          instrument: data.instrument,
          voicePart: data.voice_part,
          avatarUrl: data.avatar_url,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
        return ntccProfile;
      }

      return null;
    } catch (err) {
      console.error("Profile fetch exception:", err);
      return null;
    }
  }, []);

  /**
   * ============================================
   * This Area Of Code Is: Session Initialization
   * ============================================
   *
   * Explanation:
   * Checks for existing Supabase session on app load (from localStorage
   * or cookie). If found, restores the session and fetches the user
   * profile. This enables "remember me" functionality.
   *
   * In Other Words:
   * This is the "auto-login on return" — if you were already logged in
   * yesterday, it recognizes you and lets you right back in.
   * ============================================
   */

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setIsLoading(true);

        // Check for existing session
        const { data: { session: existingSession }, error: sessionError } = 
          await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (existingSession && mounted) {
          setSession(existingSession);
          setUser(existingSession.user);

          // Fetch profile
          const userProfile = await fetchProfile(existingSession.user.id);
          if (mounted) {
            setProfile(userProfile);
          }
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        if (mounted) {
          setError(err as AuthError);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [fetchProfile]);

  /**
   * ============================================
   * This Area Of Code Is: Auth State Listener
   * ============================================
   *
   * Explanation:
   * Subscribes to Supabase auth state changes (SIGN_IN, SIGN_OUT, TOKEN_REFRESHED,
   * USER_UPDATED). Automatically updates React state when auth events occur
   * across tabs or from external triggers.
   *
   * In Other Words:
   * This is the "security camera feed" — constantly watches for anyone
   * logging in or out and updates the attendance board in real-time.
   * ============================================
   */

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          setSession(newSession);
          setUser(newSession?.user ?? null);
          
          if (newSession?.user) {
            const userProfile = await fetchProfile(newSession.user.id);
            setProfile(userProfile);
          }
        } else if (event === "SIGNED_OUT") {
          setSession(null);
          setUser(null);
          setProfile(null);
        } else if (event === "USER_UPDATED") {
          setUser(newSession?.user ?? null);
        }

        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  /**
   * ============================================
   * This Area Of Code Is: Sign In Method
   * ============================================
   *
   * Explanation:
   * Authenticates user with email/password via Supabase Auth. On success,
   * fetches the NTCC profile and updates auth state. On failure, sets
   * error state for UI display.
   *
   * In Other Words:
   * This is the "login desk" — checks your email and password, and if
   * they match, hands you your badge and lets you into the building.
   * ============================================
   */

  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.user);

        const userProfile = await fetchProfile(data.user.id);
        setProfile(userProfile);
      }
    } catch (err) {
      setError(err as AuthError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile]);

  /**
   * ============================================
   * This Area Of Code Is: Sign Up Method
   * ============================================
   *
   * Explanation:
   * Registers a new user with Supabase Auth, then creates their NTCC profile
   * in the database with default role 'musician'. Sends email confirmation
   * if enabled in Supabase settings.
   *
   * In Other Words:
   * This is the "new hire onboarding" — creates a login account, makes
   * their personnel file, and sets them up as a musician by default.
   * ============================================
   */

  const signUp = useCallback(
    async (email: string, password: string, profileData: Partial<NTCCProfile>): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          throw signUpError;
        }

        if (data.user) {
          // Create profile with defaults
          const newProfile: Partial<NTCCProfile> = {
            id: data.user.id,
            email,
            fullName: profileData.fullName || email.split("@")[0],
            role: "musician",
            churchId: profileData.churchId || null,
            instrument: profileData.instrument || null,
            voicePart: profileData.voicePart || null,
            avatarUrl: null,
          };

          const { error: profileError } = await supabase
            .from("profiles")
            .insert([newProfile]);

          if (profileError) {
            console.error("Profile creation error:", profileError);
          }

          // Auto-sign in if email confirmation is disabled
          if (data.session) {
            setSession(data.session);
            setUser(data.user);
            setProfile(newProfile as NTCCProfile);
          }
        }
      } catch (err) {
        setError(err as AuthError);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * ============================================
   * This Area Of Code Is: Sign Out Method
   * ============================================
   *
   * Explanation:
   * Logs out the current user from Supabase, clears all auth state,
   * and removes session data from storage. Redirects to landing page.
   *
   * In Other Words:
   * This is the "clock out" button — signs you out, takes your badge,
   * and sends you home.
   * ============================================
   */

  const signOut = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        throw signOutError;
      }

      setSession(null);
      setUser(null);
      setProfile(null);
      setError(null);
    } catch (err) {
      setError(err as AuthError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * ============================================
   * This Area Of Code Is: Password Reset Method
   * ============================================
   *
   * Explanation:
   * Sends a password reset email to the user via Supabase Auth. The email
   * contains a secure link that redirects to the app's password reset page.
   *
   * In Other Words:
   * This is the "forgot password" helper — sends you an email with a
   * secret link to make a new password.
   * ============================================
   */

  const resetPassword = useCallback(async (email: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (resetError) {
        throw resetError;
      }
    } catch (err) {
      setError(err as AuthError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * ============================================
   * This Area Of Code Is: Profile Update Method
   * ============================================
   *
   * Explanation:
   * Updates the current user's NTCC profile in the database. Only allows
   * updates to the authenticated user's own profile via RLS policies.
   * Refreshes local state after successful update.
   *
   * In Other Words:
   * This is the "update your info" form — lets you change your name,
   * instrument, or other details in the personnel file.
   * ============================================
   */

  const updateProfile = useCallback(
    async (updates: Partial<NTCCProfile>): Promise<void> => {
      try {
        if (!user) {
          throw new Error("No authenticated user");
        }

        setIsLoading(true);

        const dbUpdates: Record<string, unknown> = {};
        if (updates.fullName) dbUpdates.full_name = updates.fullName;
        if (updates.role) dbUpdates.role = updates.role;
        if (updates.churchId) dbUpdates.church_id = updates.churchId;
        if (updates.instrument) dbUpdates.instrument = updates.instrument;
        if (updates.voicePart) dbUpdates.voice_part = updates.voicePart;
        if (updates.avatarUrl) dbUpdates.avatar_url = updates.avatarUrl;

        const { error: updateError } = await supabase
          .from("profiles")
          .update(dbUpdates)
          .eq("id", user.id);

        if (updateError) {
          throw updateError;
        }

        // Refresh profile
        const updatedProfile = await fetchProfile(user.id);
        setProfile(updatedProfile);
      } catch (err) {
        setError(err as AuthError);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [user, fetchProfile]
  );

  /**
   * ============================================
   * This Area Of Code Is: Role Checker
   * ============================================
   *
   * Explanation:
   * Utility function that checks if the current user has any of the
   * specified roles. Used for route guards and feature visibility.
   * Returns false if no user is authenticated.
   *
   * In Other Words:
   * This is the "access level checker" — asks "is this person a worship
   * leader or admin?" and returns yes or no.
   * ============================================
   */

  const hasRole = useCallback(
    (roles: NTCCRole[]): boolean => {
      if (!profile) return false;
      return roles.includes(profile.role);
    },
    [profile]
  );

  /**
   * ============================================
   * This Area Of Code Is: Session Refresh
   * ============================================
   *
   * Explanation:
   * Manually refreshes the Supabase session and user data. Useful for
   * recovering from expired tokens or forcing a state sync.
   *
   * In Other Words:
   * This is the "re-scan your badge" button — refreshes your login
   * status if something seems out of date.
   * ============================================
   */

  const refreshSession = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const { data, error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError) {
        throw refreshError;
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.user);

        if (data.user) {
          const userProfile = await fetchProfile(data.user.id);
          setProfile(userProfile);
        }
      }
    } catch (err) {
      setError(err as AuthError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile]);

  /**
   * ============================================
   * This Area Of Code Is: Context Value Assembly
   * ============================================
   *
   * Explanation:
   * Assembles all state and methods into the AuthContextValue object
   * that gets passed to the provider. Memoized to prevent unnecessary
   * re-renders of consuming components.
   *
   * In Other Words:
   * This is the "care package" — bundles up everything the rest of the
   * app needs to know about who's logged in.
   * ============================================
   */

  const contextValue: AuthContextValue = {
    user,
    profile,
    session,
    isLoading,
    isAuthenticated,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    hasRole,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * ============================================
 * This Area Of Code Is: Role-Based Route Guard
 * ============================================
 *
 * Explanation:
 * Higher-order component that restricts route access based on user roles.
 * Redirects unauthorized users to the dashboard. Used for admin-only
 * or conductor-only pages.
 *
 * In Other Words:
 * This is the "VIP section bouncer" — checks if you have the right
 * role to enter certain areas, and turns you away if you don't.
 * ============================================
 */

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: NTCCRole[];
  fallback?: ReactNode;
}

export function RoleGuard({
  children,
  allowedRoles,
  fallback,
}: RoleGuardProps): JSX.Element {
  const { profile, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#e0e0e0" }}>
        Checking permissions...
      </div>
    );
  }

  if (!isAuthenticated || !profile || !allowedRoles.includes(profile.role)) {
    return <>{fallback || <Navigate to="/dashboard" replace />}</>;
  }

  return <>{children}</>;
}

// Import Navigate for RoleGuard
import { Navigate } from "react-router-dom";

/**
 * ============================================
 * This Area Of Code Is: Copyright & Attribution
 * ============================================
 *
 * Explanation:
 * Legal attribution and branding footer for the NTCC Music App.
 * Required on all source files per project standards.
 *
 * In Other Words:
 * "This code belongs to Rev. Frederick Thomas and was built for NTCC Graham."
 * ============================================
 */

// © 2026 NTCC Music App | 𝑅𝑒𝑣. 𝐹𝑟𝑒𝑑𝑒𝑟𝑖𝑐𝑘 𝐷𝑤𝑎𝑦𝑛𝑒 𝑇ℎ𝑜𝑚𝑎𝑠, 𝐽𝑟., 𝑇ℎ𝑒 𝑆𝑢𝑝𝑒𝑟 𝐶𝑜𝑑𝑖𝑛𝑔 𝑁𝑖𝑛𝑗𝑎™ | Gifted with 🫶🏿 to NTCCA
// SCN Technologies™ | SCNܫܘܐ™ (SCNshava™) | #FindAWay
