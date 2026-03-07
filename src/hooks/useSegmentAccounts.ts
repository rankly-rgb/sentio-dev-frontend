import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getSegmentAccounts } from '@/lib/queries/segment-queries';
import type { SegmentType } from '@/lib/types/segments';

export function useSegmentAccounts(segment: SegmentType | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['segments', 'accounts', segment],
    queryFn: () => getSegmentAccounts(segment!),
    enabled: !!user?.organization_id && !!segment,
    staleTime: 120_000,
  });
}
