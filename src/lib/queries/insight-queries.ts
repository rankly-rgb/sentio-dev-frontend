import { supabase } from '@/lib/supabase';
import type {
  InsightsListResponse,
  InsightStatsResponse,
  InsightDetailResponse,
  InsightsFilters,
  InsightStatus,
} from '@/types/insights';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

// --- Private helper: fetch Edge Function with user JWT ---
async function fetchWithUserJwt<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Session expirée, veuillez vous reconnecter');
  }

  let res: Response;
  try {
    res = await fetch(`${SUPABASE_URL}/functions/v1/${path}`, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    });
  } catch {
    throw new Error('Erreur réseau — vérifiez votre connexion');
  }

  let data: T & { error?: string };
  try {
    data = await res.json();
  } catch {
    throw new Error(`Réponse invalide du serveur (${res.status})`);
  }

  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
  return data as T;
}

// --- List insights (paginated, filtered) ---
export async function listInsights(
  filters: InsightsFilters = {},
): Promise<InsightsListResponse> {
  const params = new URLSearchParams();
  if (filters.insight_type) params.set('insight_type', filters.insight_type);
  if (filters.priority) params.set('priority', filters.priority);
  if (filters.status) params.set('status', filters.status);
  if (filters.account_id) params.set('account_id', filters.account_id);
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.per_page) params.set('per_page', String(filters.per_page));

  const qs = params.toString();
  return fetchWithUserJwt<InsightsListResponse>(
    `insights-crud${qs ? `?${qs}` : ''}`,
  );
}

// --- Get insight stats ---
export async function getInsightStats(): Promise<InsightStatsResponse> {
  return fetchWithUserJwt<InsightStatsResponse>('insights-crud?stats=true');
}

// --- Get single insight ---
export async function getInsight(id: string): Promise<InsightDetailResponse> {
  return fetchWithUserJwt<InsightDetailResponse>(`insights-crud?id=${id}`);
}

// --- Update insight status ---
export async function updateInsightStatus(
  id: string,
  status: InsightStatus,
): Promise<InsightDetailResponse> {
  return fetchWithUserJwt<InsightDetailResponse>(`insights-crud?id=${id}`, {
    method: 'PATCH',
    body: { status },
  });
}
