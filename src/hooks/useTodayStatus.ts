import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';
import type { TodayStatusResponse } from '@/lib/types/today-status';

export function useTodayStatus() {
  const { user } = useAuth();

  return useQuery<TodayStatusResponse>({
    queryKey: ['today-status', user?.organization_id],
    queryFn: () => fetchWithUserJwt<TodayStatusResponse>('get-today-status'),
    enabled: !!user?.organization_id,
    staleTime: 60_000,
    retry: false,
  });
}
