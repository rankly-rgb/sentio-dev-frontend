import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';

export interface AccountSummaryData {
  summary: string;
  generated_at: string;
  cached: boolean;
}

export function useAccountSummary(accountId: string | null) {
  const { user } = useAuth();

  return useQuery<AccountSummaryData>({
    queryKey: ['account-summary', accountId],
    queryFn: () =>
      fetchWithUserJwt<AccountSummaryData>(
        `account-summary?account_id=${accountId}`,
      ),
    enabled: !!accountId && !!user?.organization_id,
    staleTime: 24 * 60 * 60_000,
    gcTime: 24 * 60 * 60_000,
    retry: false,
  });
}
