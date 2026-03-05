import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/productionLogger';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const REQUEST_TIMEOUT_MS = 30_000;

/**
 * Appelle une Edge Function Supabase avec le JWT utilisateur courant.
 * Lève une Error en cas de session manquante, erreur réseau, timeout ou réponse non-ok.
 */
export async function fetchWithUserJwt<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const method = options.method || 'GET';
  const fnName = path.split('?')[0];
  const t0 = performance.now();

  // TEMP DEBUG — tracer si getSession() bloque
  logger.log('EdgeFn', `→ ${method} ${fnName} [getSession START]`);
  const { data: { session } } = await supabase.auth.getSession();
  logger.log('EdgeFn', `→ ${method} ${fnName} [getSession END ${(performance.now() - t0).toFixed(0)}ms]`);

  if (!session?.access_token) {
    throw new Error('Session expirée, veuillez vous reconnecter');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${SUPABASE_URL}/functions/v1/${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      signal: controller.signal,
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    });
  } catch (err) {
    clearTimeout(timeoutId);
    logger.perf('EdgeFn', `${method} ${fnName} (network error)`, performance.now() - t0);
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(`Timeout — le serveur n'a pas répondu en ${REQUEST_TIMEOUT_MS / 1000}s`);
    }
    throw new Error('Erreur réseau — vérifiez votre connexion');
  }
  clearTimeout(timeoutId);

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
