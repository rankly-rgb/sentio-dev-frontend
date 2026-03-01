import { useQuery } from '@tanstack/react-query';
import { getAccountList, getAccountSummaryCards } from '@/lib/queries/accounts';

export function useAccounts(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  segment?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
} = {}) {
  const listQuery = useQuery({
    queryKey: ['accounts', 'list', params],
    queryFn: () => getAccountList(params),
    staleTime: 60_000,
  });

  const summaryQuery = useQuery({
    queryKey: ['accounts', 'summary'],
    queryFn: getAccountSummaryCards,
    staleTime: 60_000,
  });

  return {
    accounts: listQuery.data?.data || [],
    totalCount: listQuery.data?.count || 0,
    summary: summaryQuery.data || null,
    isLoading: listQuery.isLoading || summaryQuery.isLoading,
    error: listQuery.error || summaryQuery.error,
    refetch: () => {
      listQuery.refetch();
      summaryQuery.refetch();
    },
  };
}
