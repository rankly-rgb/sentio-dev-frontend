import { useQuery } from '@tanstack/react-query';
import { getAccountDetail } from '@/lib/queries/accounts';

export function useAccountDetail(accountId: string | undefined) {
  return useQuery({
    queryKey: ['accounts', 'detail', accountId],
    queryFn: () => {
      if (!accountId) throw new Error('Missing accountId');
      return getAccountDetail(accountId);
    },
    enabled: !!accountId,
    staleTime: 60_000,
  });
}
