import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';

interface AccountSummaryData {
  summary: string;
  generated_at: string;
  cached: boolean;
}

interface AccountSummaryResponse {
  data: AccountSummaryData;
}

export function useAccountSummary(accountId: string | null) {
  const { user } = useAuth();

  return useQuery<AccountSummaryData>({
    queryKey: ['account-summary', accountId],
    queryFn: async () => {
      const res = await fetchWithUserJwt<AccountSummaryResponse>(
        `account-summary?account_id=${accountId}`,
      );
      return res.data;
    },
    enabled: !!accountId && !!user?.organization_id,
    staleTime: 24 * 60 * 60_000,
    gcTime: 24 * 60 * 60_000,
    retry: false,
  });
}
