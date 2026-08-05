import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getPortfolioMetrics } from '@/lib/queries/portfolio-metrics';

export function usePortfolioMetrics() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard', 'portfolio-metrics', user?.organization_id],
    queryFn: getPortfolioMetrics,
    enabled: !!user?.organization_id,
    staleTime: 120_000,
  });
}
