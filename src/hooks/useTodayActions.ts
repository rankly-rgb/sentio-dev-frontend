import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getTodayActions } from '@/lib/queries/today-actions-queries';
import { filterTodayActions } from '@/lib/types/today-actions';
import type { TodayActionsSummary, TodayActionsFilters } from '@/lib/types/today-actions';

export function useTodayActions(filters?: TodayActionsFilters) {
  const { user } = useAuth();
  const orgId = user?.organization_id ?? '';

  const actionsQuery = useQuery({
    queryKey: ['today-actions', orgId],
    queryFn: () => getTodayActions(),
    enabled: !!orgId,
    staleTime: 60_000,
  });

  const allActions = actionsQuery.data?.data.actions ?? null;

  const summary: TodayActionsSummary | null = useMemo(() => {
    if (!allActions) return null;

    const filtered = filters
      ? filterTodayActions(allActions, filters)
      : allActions;

    const by_priority: TodayActionsSummary['by_priority'] = { P0: 0, P1: 0, P2: 0 };
    const by_category: TodayActionsSummary['by_category'] = {};
    let mrr_at_risk_cents = 0;
    for (const action of filtered) {
      by_priority[action.priority]++;
      if (action.priority === 'P0' || action.priority === 'P1') {
        mrr_at_risk_cents += action.mrr_cents ?? 0;
      }
      for (const pb of action.matching_playbooks) {
        const cat = pb.category ?? 'other';
        by_category[cat] = (by_category[cat] ?? 0) + 1;
      }
    }

    return { total: filtered.length, by_priority, by_category, mrr_at_risk_cents, actions: filtered };
  }, [allActions, filters]);

  return {
    summary,
    allActions: allActions ?? [],
    status: actionsQuery.data?.data.status ?? null,
    totalCount: allActions?.length ?? 0,
    isLoading: actionsQuery.isLoading,
    error: actionsQuery.error,
    refetch: () => {
      actionsQuery.refetch();
    },
  };
}
