import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';
import type { TrialStatus } from '@/lib/types/trial';

export function useTrialStatus() {
  const { user } = useAuth();

  return useQuery<TrialStatus>({
    queryKey: ['trial-status', user?.organization_id],
    queryFn: () => fetchWithUserJwt<TrialStatus>('trial-status'),
    enabled: !!user?.organization_id,
    staleTime: 5 * 60_000,
    retry: false,
  });
}
