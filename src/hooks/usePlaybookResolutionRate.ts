import { useQuery } from '@tanstack/react-query';
import { getPlaybookOutcomeStats } from '@/lib/queries/playbook-queries';

export function usePlaybookResolutionRate(playbookId: string | undefined) {
  return useQuery({
    queryKey: ['playbook-outcome-stats', playbookId],
    queryFn: () => getPlaybookOutcomeStats(playbookId ?? ''),
    enabled: !!playbookId,
    staleTime: 60_000,
  });
}
