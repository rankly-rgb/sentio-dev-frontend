import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getSegmentAccounts } from '@/lib/queries/segment-queries';
import type { SegmentType } from '@/lib/types/segments';

export function useSegmentAccounts(segment: SegmentType | null) {
  const { user } = useAuth();
  const orgId = user?.organization_id;

  return useQuery({
    queryKey: ['segments', 'accounts', segment, orgId],
    queryFn: () => getSegmentAccounts(segment!, orgId!),
    enabled: !!orgId && !!segment,
    staleTime: 120_000,
  });
}
