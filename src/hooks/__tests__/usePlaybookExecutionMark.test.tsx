import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { usePlaybookExecutionMark } from '../usePlaybookExecutionMark';
import * as playbookQueries from '@/lib/queries/playbook-queries';
import type { AttributionStatus } from '@/lib/types/playbook';

vi.mock('@/lib/queries/playbook-queries');

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

function makeStatus(overrides: Partial<AttributionStatus> = {}): AttributionStatus {
  return {
    execution_id: 'exec-1',
    executed_at: null,
    attribution_deadline_at: null,
    attribution_status: 'not_executed',
    time_remaining_seconds: null,
    ...overrides,
  };
}

describe('usePlaybookExecutionMark', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exposes not_executed status before any mark', async () => {
    vi.mocked(playbookQueries.getAttributionStatus).mockResolvedValue(makeStatus());

    const { result } = renderHook(() => usePlaybookExecutionMark('exec-1'), { wrapper });

    await waitFor(() => expect(result.current.attributionStatus?.attribution_status).toBe('not_executed'));
    expect(result.current.withinCancelWindow).toBe(false);
  });

  it('reports active status with a window still open after marking', async () => {
    const now = new Date();
    vi.mocked(playbookQueries.getAttributionStatus).mockResolvedValue(
      makeStatus({
        attribution_status: 'active',
        executed_at: now.toISOString(),
        attribution_deadline_at: new Date(now.getTime() + 14 * 86400_000).toISOString(),
        time_remaining_seconds: 14 * 86400,
      }),
    );

    const { result } = renderHook(() => usePlaybookExecutionMark('exec-1'), { wrapper });

    await waitFor(() => expect(result.current.attributionStatus?.attribution_status).toBe('active'));
    // executed_at is "now" in this test, so we're still well within the 5-minute cancel window
    expect(result.current.withinCancelWindow).toBe(true);
  });

  it('does not allow cancellation once the 5-minute window has elapsed', async () => {
    const sixMinutesAgo = new Date(Date.now() - 6 * 60_000);
    vi.mocked(playbookQueries.getAttributionStatus).mockResolvedValue(
      makeStatus({
        attribution_status: 'active',
        executed_at: sixMinutesAgo.toISOString(),
        attribution_deadline_at: new Date(sixMinutesAgo.getTime() + 14 * 86400_000).toISOString(),
        time_remaining_seconds: 14 * 86400 - 360,
      }),
    );

    const { result } = renderHook(() => usePlaybookExecutionMark('exec-1'), { wrapper });

    await waitFor(() => expect(result.current.attributionStatus?.attribution_status).toBe('active'));
    expect(result.current.withinCancelWindow).toBe(false);
  });

  it('calls markExecuted and refetches attribution-status on success', async () => {
    vi.mocked(playbookQueries.getAttributionStatus).mockResolvedValue(makeStatus());
    vi.mocked(playbookQueries.markExecuted).mockResolvedValue({
      execution_id: 'exec-1',
      executed_at: new Date().toISOString(),
      attribution_deadline_at: new Date(Date.now() + 14 * 86400_000).toISOString(),
    });

    const { result } = renderHook(() => usePlaybookExecutionMark('exec-1'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    result.current.mark();

    await waitFor(() => expect(playbookQueries.markExecuted).toHaveBeenCalledWith('exec-1'));
    // getAttributionStatus is refetched (invalidated) after a successful mark
    await waitFor(() => expect(playbookQueries.getAttributionStatus).toHaveBeenCalledTimes(2));
  });
});
