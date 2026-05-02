import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/productionLogger'; // TEMP DEBUG

const SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string | undefined;

if (!SERVICE_ROLE_KEY) {
  console.warn('[invokeEdgeFunction] VITE_SUPABASE_SERVICE_ROLE_KEY manquante — les appels service_role échoueront');
}

const DEFAULT_TIMEOUT_MS = 90_000;

/**
 * Appelle une Edge Function Supabase avec le service_role JWT.
 * Générique : retourne `data as T` (par défaut void).
 */
export async function invokeWithServiceRole<T = void>(
  fnName: string,
  body?: Record<string, unknown>,
  method?: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  if (!SERVICE_ROLE_KEY) {
    throw new Error('Configuration manquante : clé service_role non disponible');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const options: Record<string, unknown> = {
    headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
    signal: controller.signal,
  };
  if (method) {
    options.method = method;
  }
  if (body) {
    options.body = body;
  }

  // TEMP DEBUG — timing des appels Edge Function
  const t0 = performance.now();
  logger.log('EdgeFunction', `→ ${method || 'POST'} ${fnName}`, body);

  try {
    const { data, error } = await supabase.functions.invoke(fnName, options);

    const duration = performance.now() - t0;
    logger.perf('EdgeFunction', `${fnName}`, duration);

    if (error) throw new Error(`Edge Function "${fnName}" : ${error.message}`);
    return data as T;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Edge Function "${fnName}" : délai dépassé (${timeoutMs / 1000}s)`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
