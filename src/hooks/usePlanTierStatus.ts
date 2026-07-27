import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getPricingStatus } from '@/lib/queries/pricing-queries';

export function usePlanTierStatus() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pricing-status', user?.organization_id],
    queryFn: getPricingStatus,
    enabled: !!user?.organization_id,
    staleTime: 5 * 60_000,
  });
}
