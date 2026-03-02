import { supabase } from '@/lib/supabase';

const SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string;

/**
 * Appelle une Edge Function Supabase avec le service_role JWT.
 * Générique : retourne `data as T` (par défaut void).
 */
export async function invokeWithServiceRole<T = void>(
  fnName: string,
  body?: Record<string, unknown>,
  method?: string,
): Promise<T> {
  const options: Record<string, unknown> = {
    headers: SERVICE_ROLE_KEY
      ? { Authorization: `Bearer ${SERVICE_ROLE_KEY}` }
      : undefined,
  };
  if (method) {
    options.method = method;
  }
  if (body) {
    options.body = body;
  }
  const { data, error } = await supabase.functions.invoke(fnName, options);
  if (error) throw error;
  return data as T;
}
