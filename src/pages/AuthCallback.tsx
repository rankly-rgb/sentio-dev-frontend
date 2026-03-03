import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/productionLogger';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        navigate(session ? '/dashboard' : '/login');
      })
      .catch((err) => {
        logger.error('AuthCallback', 'Échec récupération session', err);
        navigate('/login?reason=callback_error');
      });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Redirection en cours...</p>
    </div>
  );
}
