import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/productionLogger';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    async function handleCallback() {
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get('token_hash');
      const type = params.get('type');
      const code = params.get('code');

      // Case 1 — email confirmation or password recovery (token_hash)
      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as 'signup' | 'recovery' | 'email',
        });

        if (error) {
          logger.error('AuthCallback', 'verifyOtp failed', { type });
          navigate('/login?error=confirmation_failed', { replace: true });
          return;
        }

        if (type === 'signup') {
          navigate('/onboarding/promise', { replace: true });
          return;
        }

        if (type === 'recovery') {
          navigate('/login?reason=reset', { replace: true });
          return;
        }

        navigate('/dashboard', { replace: true });
        return;
      }

      // Case 2 — OAuth PKCE (code)
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          logger.error('AuthCallback', 'exchangeCodeForSession failed');
          navigate('/login?error=oauth_failed', { replace: true });
          return;
        }
        navigate('/dashboard', { replace: true });
        return;
      }

      // Case 3 — implicit flow legacy (hash fragment with access_token)
      if (window.location.hash.includes('access_token')) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          navigate('/dashboard', { replace: true });
          return;
        }
      }

      // Fallback
      navigate('/login', { replace: true });
    }

    handleCallback().catch((err) => {
      logger.error('AuthCallback', 'Unexpected error', err);
      navigate('/login?error=callback_error', { replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <p>Connexion en cours...</p>
      </div>
    </div>
  );
}
