import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';
import type {
  InsightsListResponse,
  InsightStatsResponse,
  InsightDetailResponse,
  InsightsFilters,
  InsightStatus,
} from '@/types/insights';

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
