import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { visibilityMonitor } from '@/utils/visibilityMonitor';
import { logger } from '@/utils/productionLogger';

interface AuthUser {
  id: string;
  email: string;
  organization_id: string;
  organization_name: string;
  full_name: string | null;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  supabaseUser: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const profileLoadedRef = useRef(false);
  const sessionRef = useRef<Session | null>(null);
  const supabaseUserRef = useRef<User | null>(null);

  async function loadProfile(authUserId: string, email: string) {
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
            name
          )
        `)
        .eq('auth_user_id', authUserId)
        .single();

      if (profileError || !profile) {
        if (import.meta.env.DEV) console.error('[AuthContext] Erreur chargement profil:', profileError);
        return null;
      }

      const orgData = Array.isArray(profile.organizations)
        ? profile.organizations[0]
        : profile.organizations;

      const authUser: AuthUser = {
        id: profile.id,
        email,
        organization_id: profile.organization_id,
        organization_name: orgData?.name || 'Organisation inconnue',
        full_name: profile.full_name,
        role: profile.role,
      };

      setUser(authUser);
      return authUser;
    } catch (error) {
      if (import.meta.env.DEV) console.error('[AuthContext] Erreur inattendue:', error);
      return null;
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      sessionRef.current = session;
      supabaseUserRef.current = session?.user ?? null;

      if (session?.user && !profileLoadedRef.current) {
        profileLoadedRef.current = true;
        loadProfile(session.user.id, session.user.email || '').finally(() => {
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        sessionRef.current = session;
        supabaseUserRef.current = session?.user ?? null;

        if (session?.user) {
          if (event === 'SIGNED_IN' || !profileLoadedRef.current) {
            profileLoadedRef.current = true;
            await loadProfile(session.user.id, session.user.email || '');
          }
        } else {
          profileLoadedRef.current = false;
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = visibilityMonitor.onReturn(async () => {
      logger.log('AuthContext', 'Retour onglet après inactivité, vérification session');

      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          logger.error('AuthContext', 'Échec vérification session', error);
          return;
        }

        if (!session) {
          logger.error('AuthContext', 'Session perdue pendant inactivité');
          profileLoadedRef.current = false;
          setUser(null);
          return;
        }

        const expiresAt = session.expires_at || 0;
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = expiresAt - now;

        if (timeUntilExpiry < 600) {
          const { data: { session: newSession }, error: refreshError } =
            await supabase.auth.refreshSession();

          if (refreshError) {
            logger.error('AuthContext', 'Échec rafraîchissement token', refreshError);
          } else if (newSession) {
            sessionRef.current = newSession;
            supabaseUserRef.current = newSession.user ?? null;
          }
        } else {
          sessionRef.current = session;
          supabaseUserRef.current = session.user ?? null;
        }
      } catch (error) {
        logger.error('AuthContext', 'Erreur gestion visibilité onglet', error);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      return {};
    } catch {
      return { error: 'Une erreur inattendue est survenue' };
    }
  };

  const logout = async () => {
    profileLoadedRef.current = false;
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      supabaseUser: supabaseUserRef.current,
      session: sessionRef.current,
      loading,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider');
  return ctx;
}
