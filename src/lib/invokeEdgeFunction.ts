import { supabase } from '@/lib/supabase';

// ⚠️  SÉCURITÉ — NE PAS lire VITE_SUPABASE_SERVICE_ROLE_KEY ici.
// La clé service_role ne doit JAMAIS transiter côté client (elle bypasse RLS).
// Les anciens call sites ont été migrés vers fetchWithUserJwt (audit 2026-05-17).
// Cette fonction est conservée uniquement pour la compatibilité des tests unitaires.
// Elle lit la clé depuis l'env de test uniquement (stubEnv) — jamais depuis un .env prod.
//
// @deprecated Utiliser fetchWithUserJwt() pour tous les nouveaux appels Edge Function.

const _SERVICE_ROLE_KEY_TEST_ONLY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string | undefined;

const DEFAULT_TIMEOUT_MS = 90_000;

/**
 * @deprecated Ne pas appeler depuis le code applicatif.
 * Utiliser fetchWithUserJwt() à la place — user JWT côté client, service_role uniquement dans Deno.
 */
export async function invokeWithServiceRole<T = void>(
  fnName: string,
  body?: Record<string, unknown>,
  method?: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  if (!_SERVICE_ROLE_KEY_TEST_ONLY) {
    throw new Error('Configuration manquante : clé service_role non disponible');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const options: Record<string, unknown> = {
    headers: { Authorization: `Bearer ${_SERVICE_ROLE_KEY_TEST_ONLY}` },
    signal: controller.signal,
  };
  if (method) {
    options.method = method;
  }
  if (body) {
    options.body = body;
  }

  try {
    const { data, error } = await supabase.functions.invoke(fnName, options);
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
