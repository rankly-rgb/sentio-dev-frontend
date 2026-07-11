import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/productionLogger';

export class TrialExpiredError extends Error {
  readonly status = 402;
  constructor() {
    super('Trial expired — please update your subscription');
    this.name = 'TrialExpiredError';
  }
}

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
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Session expired, please log in again');
  }

  const method = options.method || 'GET';
  const fnName = path.split('?')[0];
  const t0 = performance.now();
  logger.log('EdgeFn', `→ ${method} ${fnName}`);

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
      throw new Error(`Timeout — server did not respond in ${REQUEST_TIMEOUT_MS / 1000}s`);
    }
    throw new Error('Network error — check your connection');
  }
  clearTimeout(timeoutId);

  logger.perf('EdgeFn', `${method} ${fnName} (${res.status})`, performance.now() - t0);

  let data: T & { error?: string };
  try {
    data = await res.json();
  } catch {
    throw new Error(`Invalid server response (${res.status})`);
  }

  if (res.status === 402) throw new TrialExpiredError();
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data as T;
}
