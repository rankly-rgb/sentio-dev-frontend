import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';
import type { TodayActionsResponse } from '@/lib/types/today-actions';

// --- Get unified priority actions (C2.4a/b) ---
export async function getTodayActions(): Promise<TodayActionsResponse> {
  return fetchWithUserJwt<TodayActionsResponse>('get-today-actions');
}
