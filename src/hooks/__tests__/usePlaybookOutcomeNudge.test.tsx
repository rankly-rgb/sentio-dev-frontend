import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { usePlaybookOutcomeNudge } from '../usePlaybookOutcomeNudge';
import * as playbookQueries from '@/lib/queries/playbook-queries';

vi.mock('@/lib/queries/playbook-queries');

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('usePlaybookOutcomeNudge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is not due when attribution_status is not "expired"', () => {
    const { result } = renderHook(() => usePlaybookOutcomeNudge('exec-1', 'active'), { wrapper });
    expect(result.current.isNudgeDue).toBe(false);
  });

  it('is due when attribution_status is "expired" and no response was recorded yet', () => {
    const { result } = renderHook(() => usePlaybookOutcomeNudge('exec-1', 'expired'), { wrapper });
    expect(result.current.isNudgeDue).toBe(true);
  });

  it('stops being due once a response has been submitted', async () => {
    vi.mocked(playbookQueries.postNudgeResponse).mockResolvedValue({
      nudge_response: 'resolved',
      nudge_responded_at: new Date().toISOString(),
    });

    const { result } = renderHook(() => usePlaybookOutcomeNudge('exec-1', 'expired'), { wrapper });
    expect(result.current.isNudgeDue).toBe(true);

    result.current.submitNudge('resolved');

    await waitFor(() => expect(result.current.nudgeResponse).toBe('resolved'));
    expect(result.current.isNudgeDue).toBe(false);
  });

  it('only sends the declarative response — never touches account_converted/resolved_via (non-overwrite rule, § 8.4)', async () => {
    vi.mocked(playbookQueries.postNudgeResponse).mockResolvedValue({
      nudge_response: 'not_resolved',
      nudge_responded_at: new Date().toISOString(),
    });

    const { result } = renderHook(() => usePlaybookOutcomeNudge('exec-1', 'expired'), { wrapper });
    result.current.submitNudge('not_resolved');

    await waitFor(() => expect(playbookQueries.postNudgeResponse).toHaveBeenCalled());
    // The mutation call site only ever forwards (executionId, response) — no
    // account_converted/resolved_via field exists anywhere in this call
    expect(playbookQueries.postNudgeResponse).toHaveBeenCalledWith('exec-1', 'not_resolved');
    expect(playbookQueries.postNudgeResponse).toHaveBeenCalledTimes(1);
  });
});
