import { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { visibilityMonitor } from '@/utils/visibilityMonitor';
import { logger } from '@/utils/productionLogger';

interface AuthUser {
  id: string;
  email: string;
  organization_id: string;
  organization_name: string;
  currency: string;
  full_name: string | null;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  supabaseUser: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, companyName: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const profileLoadedRef = useRef(false);
  const profilePromiseRef = useRef<Promise<AuthUser | null> | null>(null);
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();

  const loadProfile = useCallback(async (authUserId: string, email: string) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles_')
        .select(`
          id,
          auth_user_id,
          organization_id,
          full_name,
          role,
          organizations:organization_id (
            id,
            name,
            currency
          )
        `)
        .eq('auth_user_id', authUserId)
        .single();

      if (profileError || !profile) {
        logger.error('AuthContext', 'Profile loading error', profileError);
        return null;
      }

      const orgData = Array.isArray(profile.organizations)
        ? profile.organizations[0]
        : profile.organizations;

      const authUser: AuthUser = {
        id: profile.id,
        email,
        organization_id: profile.organization_id,
        organization_name: orgData?.name || 'Unknown organization',
        currency: orgData?.currency || 'usd',
        full_name: profile.full_name,
        role: profile.role,
      };

      setUser(authUser);
      return authUser;
    } catch (error) {
      logger.error('AuthContext', 'Unexpected profile loading error', error);
      return null;
    }
  }, []);

  // Schedule loadProfile OUTSIDE onAuthStateChange to avoid Supabase session lock deadlock.
  // The Supabase client holds an internal lock during onAuthStateChange callbacks.
  // Calling supabase.from(...) inside that callback re-enters the lock → deadlock.
  // setTimeout(fn, 0) defers the call to after the callback returns and the lock is released.
  const scheduleProfileLoad = useCallback((userId: string, email: string) => {
    profileLoadedRef.current = true;
    const p = new Promise<AuthUser | null>((resolve) => {
      setTimeout(async () => {
        resolve(await loadProfile(userId, email));
      }, 0);
    });
    profilePromiseRef.current = p;
  }, [loadProfile]);

  // Redirect vers login quand la session est irrémédiablement perdue
  const handleSessionLost = useCallback(() => {
    profileLoadedRef.current = false;
    profilePromiseRef.current = null;
    setUser(null);
    setSupabaseUser(null);
    setSession(null);
    queryClient.clear();

    // Éviter les redirections multiples
    if (redirectTimeoutRef.current) return;
    redirectTimeoutRef.current = setTimeout(() => {
      redirectTimeoutRef.current = null;
      if (window.location.pathname !== '/login' &&
          window.location.pathname !== '/' &&
          window.location.pathname !== '/auth/callback') {
        window.location.href = '/login?reason=session_expired';
      }
    }, 100);
  }, [queryClient]);

  useEffect(() => {
    // Souscrire AVANT getSession pour ne manquer aucun événement
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        logger.log('AuthContext', `Auth event: ${event}`);

        setSession(newSession);
        setSupabaseUser(newSession?.user ?? null);

        switch (event) {
          case 'SIGNED_IN':
          case 'USER_UPDATED':
          case 'TOKEN_REFRESHED':
            if (newSession?.user && !profileLoadedRef.current) {
              scheduleProfileLoad(newSession.user.id, newSession.user.email || '');
            }
            break;

          case 'SIGNED_OUT':
            handleSessionLost();
            break;

          default:
            // INITIAL_SESSION, MFA_CHALLENGE_VERIFIED, PASSWORD_RECOVERY
            if (newSession?.user && !profileLoadedRef.current) {
              scheduleProfileLoad(newSession.user.id, newSession.user.email || '');
            } else if (!newSession) {
              profileLoadedRef.current = false;
              setUser(null);
            }
            break;
        }
      }
    );

    // Ensuite, charger la session initiale
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setSupabaseUser(initialSession?.user ?? null);

      if (initialSession?.user && !profileLoadedRef.current) {
        scheduleProfileLoad(initialSession.user.id, initialSession.user.email || '');
      }
      // Wait for profile (whether triggered here or by INITIAL_SESSION event)
      if (profilePromiseRef.current) {
        await profilePromiseRef.current;
      }
      setLoading(false);
    }).catch((err) => {
      logger.error('AuthContext', 'Initial getSession failed', err);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, [scheduleProfileLoad, handleSessionLost]);

  // Vérification session au retour d'onglet
  useEffect(() => {
    const unsubscribe = visibilityMonitor.onReturn(async () => {
      logger.log('AuthContext', 'Tab focus after inactivity, checking session');

      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();

        if (error) {
          logger.error('AuthContext', 'Session check failed', error);
          return;
        }

        if (!currentSession) {
          logger.error('AuthContext', 'Session lost during inactivity');
          handleSessionLost();
          return;
        }

        const expiresAt = currentSession.expires_at || 0;
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = expiresAt - now;

        if (timeUntilExpiry < 600) {
          const { data: { session: newSession }, error: refreshError } =
            await supabase.auth.refreshSession();

          if (refreshError || !newSession) {
            logger.error('AuthContext', 'Token refresh failed — redirecting to login', refreshError);
            handleSessionLost();
          } else {
            setSession(newSession);
            setSupabaseUser(newSession.user ?? null);
          }
        } else {
          setSession(currentSession);
          setSupabaseUser(currentSession.user ?? null);
        }
      } catch (error) {
        logger.error('AuthContext', 'Tab visibility handling error', error);
      }
    });

    return unsubscribe;
  }, [handleSessionLost]);

  const login = useCallback(async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      return {};
    } catch {
      return { error: 'An unexpected error occurred' };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, companyName: string): Promise<{ error?: string }> => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { company_name: companyName } },
      });
      if (error) return { error: error.message };
      return {};
    } catch {
      return { error: 'An unexpected error occurred' };
    }
  }, []);

  const logout = useCallback(async () => {
    profileLoadedRef.current = false;
    profilePromiseRef.current = null;
    queryClient.clear();
    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
    setSession(null);
  }, [queryClient]);

  const value = useMemo<AuthContextType>(() => ({
    user,
    supabaseUser,
    session,
    loading,
    login,
    signUp,
    logout,
  }), [user, supabaseUser, session, loading, login, signUp, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
