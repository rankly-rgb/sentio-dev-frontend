import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getBenchmarkData } from '@/lib/queries/benchmark-queries';

export function useBenchmarkData() {
  const { user } = useAuth();
  const orgId = user?.organization_id;

  return useQuery({
    queryKey: ['dashboard', 'benchmark', orgId],
    queryFn: getBenchmarkData,
    enabled: !!orgId,
    staleTime: 300_000, // 5 min — external benchmarks change infrequently
  });
}
