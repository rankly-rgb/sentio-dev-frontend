import { useQuery } from '@tanstack/react-query';
import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';
import type { HealthCheckResponse } from '@/types/ops';

export function useOpsHealthCheck() {
  return useQuery<HealthCheckResponse>({
    queryKey: ['ops', 'health-check'],
    queryFn: () =>
      fetchWithUserJwt<HealthCheckResponse>('health-check', { method: 'GET' }),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    staleTime: 25_000,
    retry: 2,
  });
}
