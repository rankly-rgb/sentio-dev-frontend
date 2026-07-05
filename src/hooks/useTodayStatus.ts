import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';
import type { TodayStatusResponse } from '@/lib/types/today-status';

interface TodayStatusApiResponse {
  data: TodayStatusResponse;
}

export function useTodayStatus() {
  const { user } = useAuth();

  return useQuery<TodayStatusResponse>({
    queryKey: ['today-status', user?.organization_id],
    queryFn: async () => {
      try {
        const res = await fetchWithUserJwt<TodayStatusApiResponse>('get-today-status');
        return res.data;
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
