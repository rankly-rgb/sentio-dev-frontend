import { useQuery } from '@tanstack/react-query';
import { invokeWithServiceRole } from '@/lib/invokeEdgeFunction';
import type { HealthCheckResponse } from '@/types/ops';

export function useOpsHealthCheck() {
  return useQuery<HealthCheckResponse>({
    queryKey: ['ops', 'health-check'],
    queryFn: () =>
      invokeWithServiceRole<HealthCheckResponse>('health-check', undefined, 'GET'),
    refetchInterval: 30_000,
    staleTime: 25_000,
    retry: 2,
  });
}
