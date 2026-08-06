import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { usePlaybookResolutionRate } from '../usePlaybookResolutionRate';
import * as playbookQueries from '@/lib/queries/playbook-queries';
import type { PlaybookOutcomeStats } from '@/lib/types/playbook';

vi.mock('@/lib/queries/playbook-queries');

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('usePlaybookResolutionRate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not fetch when playbookId is undefined', () => {
    renderHook(() => usePlaybookResolutionRate(undefined), { wrapper });
    expect(playbookQueries.getPlaybookOutcomeStats).not.toHaveBeenCalled();
  });

  it('never defaults resolution_rate to 0 when sample_size is 0 (contract § 8.3)', async () => {
    const stats: PlaybookOutcomeStats = {
      playbook_id: 'pb-1',
      executed: { sample_size: 0, resolved_count: 0, resolution_rate: null, sample_size_warning: true },
      not_executed: { sample_size: 45, resolved_count: 10, resolution_rate: 0.22, sample_size_warning: false },
    };
    vi.mocked(playbookQueries.getPlaybookOutcomeStats).mockResolvedValue(stats);

    const { result } = renderHook(() => usePlaybookResolutionRate('pb-1'), { wrapper });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.executed.resolution_rate).toBeNull();
    expect(result.current.data?.executed.sample_size_warning).toBe(true);
  });

  it('surfaces the sample_size_warning branch for a small sample', async () => {
    const stats: PlaybookOutcomeStats = {
      playbook_id: 'pb-1',
      executed: { sample_size: 5, resolved_count: 2, resolution_rate: 0.4, sample_size_warning: true },
      not_executed: { sample_size: 3, resolved_count: 1, resolution_rate: 0.33, sample_size_warning: true },
    };
    vi.mocked(playbookQueries.getPlaybookOutcomeStats).mockResolvedValue(stats);

    const { result } = renderHook(() => usePlaybookResolutionRate('pb-1'), { wrapper });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.executed.sample_size_warning).toBe(true);
    expect(result.current.data?.not_executed.sample_size_warning).toBe(true);
  });
});
