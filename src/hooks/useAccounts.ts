import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getAccountList, getAccountSummaryCards } from '@/lib/queries/accounts';

export function useAccounts(params: {
  cursor?: string | null;
  limit?: number;
  search?: string;
} = {}) {
  const { user } = useAuth();

  const listQuery = useQuery({
    queryKey: ['accounts', 'list', params],
    queryFn: () => getAccountList(params),
    enabled: !!user?.organization_id,
    staleTime: 60_000,
  });

  const summaryQuery = useQuery({
    queryKey: ['accounts', 'summary'],
    queryFn: getAccountSummaryCards,
    enabled: !!user?.organization_id,
    staleTime: 60_000,
  });

  const summary = summaryQuery.data
    ? {
        ...summaryQuery.data,
        // Use accounts-api's org-wide totals (same get_portfolio_snapshot RPC as
        // Overview/Today) instead of the unpaginated client-side reduction, so the
        // three screens never show contradictory account counts / MRR figures.
        total_accounts: listQuery.data?.total_count ?? summaryQuery.data.total_accounts,
        total_mrr_cents: listQuery.data?.total_mrr_cents ?? summaryQuery.data.total_mrr_cents,
      }
    : null;

  return {
    accounts: listQuery.data?.data || [],
    nextCursor: listQuery.data?.pagination.next_cursor ?? null,
    hasMore: listQuery.data?.pagination.has_more ?? false,
    summary,
    isLoading: listQuery.isLoading || summaryQuery.isLoading,
    error: listQuery.error || summaryQuery.error,
    refetch: () => {
      listQuery.refetch();
      summaryQuery.refetch();
    },
  };
}
