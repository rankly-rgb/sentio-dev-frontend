import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { listPlaybooks } from '@/lib/queries/playbook-queries';
import {
  computeTodayActions,
  buildTodayActionsSummary,
} from '@/lib/types/today-actions';
import type { Account } from '@/types/database';
import type { TodayActionsSummary, TodayActionsFilters } from '@/lib/types/today-actions';
import { getSegmentFilter } from '@/lib/queries/segment-queries';
import type { SegmentType } from '@/lib/types/segments';
import { isValidSegmentKey } from '@/lib/types/segments';

async function fetchAllAccounts(organizationId: string): Promise<Account[]> {
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('organization_id', organizationId)
    .limit(10000);

  if (error) throw error;
  return (data ?? []) as Account[];
}

export function useTodayActions(filters?: TodayActionsFilters) {
  const { user } = useAuth();
  const orgId = user?.organization_id ?? '';

  const accountsQuery = useQuery({
    queryKey: ['today-actions', 'accounts', orgId],
    queryFn: () => fetchAllAccounts(orgId),
    enabled: !!orgId,
    staleTime: 60_000,
  });

  const playbooksQuery = useQuery({
    queryKey: ['today-actions', 'playbooks', orgId],
    queryFn: () => listPlaybooks(orgId, { per_page: 100 }),
    enabled: !!orgId,
    staleTime: 60_000,
  });

  const summary: TodayActionsSummary | null = useMemo(() => {
    if (!accountsQuery.data || !playbooksQuery.data) return null;

    let actions = computeTodayActions(accountsQuery.data, playbooksQuery.data.data);

    // Apply filters
    if (filters?.priority) {
      actions = actions.filter((a) => a.priority === filters.priority);
    }

    if (filters?.segment && isValidSegmentKey(filters.segment)) {
      const segFilter = getSegmentFilter(filters.segment as SegmentType);
      // Build a lookup of account IDs in this segment
      const accountsInSegment = new Set(
        accountsQuery.data.filter(segFilter).map((a) => a.id),
      );
      actions = actions.filter((a) => accountsInSegment.has(a.account_id));
    }

    if (filters?.category) {
      actions = actions.filter((a) =>
        a.matching_playbooks.some((pb) => pb.category === filters.category),
      );
    }

    if (filters?.mrrMin !== undefined && filters.mrrMin > 0) {
      const minCents = filters.mrrMin * 100;
      actions = actions.filter((a) => a.mrr_cents >= minCents);
    }

    return buildTodayActionsSummary(actions);
  }, [accountsQuery.data, playbooksQuery.data, filters?.priority, filters?.segment, filters?.category, filters?.mrrMin]);

  // Unfiltered count for sidebar badge
  const totalUnfilteredCount = useMemo(() => {
    if (!accountsQuery.data || !playbooksQuery.data) return 0;
    return computeTodayActions(accountsQuery.data, playbooksQuery.data.data).length;
  }, [accountsQuery.data, playbooksQuery.data]);

  return {
    summary,
    totalCount: totalUnfilteredCount,
    accounts: accountsQuery.data ?? [],
    playbooks: playbooksQuery.data?.data ?? [],
    isLoading: accountsQuery.isLoading || playbooksQuery.isLoading,
    error: accountsQuery.error ?? playbooksQuery.error,
    refetch: () => {
      accountsQuery.refetch();
      playbooksQuery.refetch();
    },
  };
}
