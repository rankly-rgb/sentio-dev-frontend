import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAttributionStatus,
  markExecuted,
  unmarkExecuted,
} from '@/lib/queries/playbook-queries';

// § 8.1.1 — deliberately restricted to catching an accidental click, not the full
// 14-day attribution window (which would let the executed resolution rate, §8.3,
// be skewed retroactively — SC-006)
const CANCEL_WINDOW_MS = 5 * 60 * 1000;

export function attributionStatusQueryKey(executionId: string) {
  return ['playbook-attribution-status', executionId] as const;
}

export function usePlaybookExecutionMark(executionId: string) {
  const queryClient = useQueryClient();
  const queryKey = attributionStatusQueryKey(executionId);

  const query = useQuery({
    queryKey,
    queryFn: () => getAttributionStatus(executionId),
    enabled: !!executionId,
    staleTime: 30_000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const markMutation = useMutation({
    mutationFn: () => markExecuted(executionId),
    onSuccess: invalidate,
  });

  const unmarkMutation = useMutation({
    mutationFn: () => unmarkExecuted(executionId),
    // Refetch rather than assume success — a 409 (window race, or a resolution/nudge
    // conflict that slipped past the client-side gate) must be reflected from the server
    onSettled: invalidate,
  });

  const attributionStatus = query.data;
  const executedAtMs = attributionStatus?.executed_at
    ? new Date(attributionStatus.executed_at).getTime()
    : null;
  const withinCancelWindow = executedAtMs !== null && Date.now() - executedAtMs < CANCEL_WINDOW_MS;

  return {
    attributionStatus,
    isLoading: query.isLoading,
    error: query.error,
    mark: markMutation.mutate,
    isMarking: markMutation.isPending,
    unmark: unmarkMutation.mutate,
    isUnmarking: unmarkMutation.isPending,
    withinCancelWindow,
  };
}
