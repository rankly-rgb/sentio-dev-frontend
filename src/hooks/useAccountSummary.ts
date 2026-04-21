import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';

interface AccountSummaryResponse {
  summary: string;
  generated_at: string;
  cached: boolean;
}

export function useAccountSummary(accountId: string | null) {
  const { user } = useAuth();

  return useQuery<AccountSummaryResponse>({
    queryKey: ['account-summary', accountId],
    queryFn: () =>
      fetchWithUserJwt<AccountSummaryResponse>(
        `account-summary?account_id=${accountId}`,
      ),
    enabled: !!accountId && !!user?.organization_id,
    staleTime: 24 * 60 * 60_000,
    gcTime: 24 * 60 * 60_000,
    retry: false,
  });
}
