import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  listInsights,
  getInsightStats,
  updateInsightStatus,
} from '@/lib/queries/insight-queries';
import type { InsightsFilters, Insight, InsightStatus, InsightsListResponse } from '@/types/insights';

const KEYS = {
  all: ['insights'] as const,
  list: (filters: InsightsFilters) => ['insights', 'list', filters] as const,
  stats: () => ['insights', 'stats'] as const,
};

// --- List insights (paginated + filtered) ---
export function useInsights(filters: InsightsFilters = {}) {
  const { user } = useAuth();
  return useQuery({
    queryKey: KEYS.list(filters),
    queryFn: () => listInsights(filters),
    enabled: !!user?.organization_id,
    staleTime: 60_000,
  });
}

// --- Stats (KPI cards) ---
export function useInsightStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: KEYS.stats(),
    queryFn: () => getInsightStats(),
    enabled: !!user?.organization_id,
    staleTime: 60_000,
  });
}

// --- Status transitions (optimistic) ---
export function useUpdateInsightStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: InsightStatus }) =>
      updateInsightStatus(id, status),
    onMutate: async ({ id, status }) => {
      // Cancel running queries
      await qc.cancelQueries({ queryKey: ['insights', 'list'] });
      // Snapshot all list caches for rollback
      const previousLists = qc.getQueriesData<InsightsListResponse>({ queryKey: ['insights', 'list'] });
      // Optimistically update all matching list caches
      qc.setQueriesData<InsightsListResponse>(
        { queryKey: ['insights', 'list'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((insight: Insight) =>
              insight.id === id ? { ...insight, status } : insight,
            ),
          };
        },
      );
      return { previousLists };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previousLists) {
        for (const [key, data] of context.previousLists) {
          qc.setQueryData(key, data);
        }
      }
      toast.error('Erreur lors de la mise à jour du statut');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['insights'] });
    },
  });
}
