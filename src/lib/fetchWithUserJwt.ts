import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/productionLogger';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

/**
 * Appelle une Edge Function Supabase avec le JWT utilisateur courant.
 * Lève une Error en cas de session manquante, erreur réseau ou réponse non-ok.
 */
export async function fetchWithUserJwt<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Session expirée, veuillez vous reconnecter');
  }

  const method = options.method || 'GET';
  const fnName = path.split('?')[0];
  const t0 = performance.now();
  logger.log('EdgeFn', `→ ${method} ${fnName}`);

  let res: Response;
  try {
    res = await fetch(`${SUPABASE_URL}/functions/v1/${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    });
  } catch {
    logger.perf('EdgeFn', `${method} ${fnName} (network error)`, performance.now() - t0);
    throw new Error('Erreur réseau — vérifiez votre connexion');
  }

  logger.perf('EdgeFn', `${method} ${fnName} (${res.status})`, performance.now() - t0);

  let data: T & { error?: string };
  try {
    data = await res.json();
  } catch {
    throw new Error(`Réponse invalide du serveur (${res.status})`);
  }

  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
  return data as T;
}
