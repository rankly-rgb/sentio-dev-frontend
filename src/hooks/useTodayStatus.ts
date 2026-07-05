import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';
import type { TodayStatusResponse } from '@/lib/types/today-status';

export function useTodayStatus() {
  const { user } = useAuth();

  return useQuery<TodayStatusResponse>({
    queryKey: ['today-status', user?.organization_id],
    queryFn: async () => {
      try {
        return await fetchWithUserJwt<TodayStatusResponse>('get-today-status');
      } catch (error) {
        console.error('[useTodayStatus]', error);
        throw error;
      }
    },
    enabled: !!user?.organization_id,
    staleTime: 60_000,
    retry: false,
  });
}
