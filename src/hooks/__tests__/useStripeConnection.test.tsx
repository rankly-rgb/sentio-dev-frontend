import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useUpdateStripeConnection, useDisconnectStripeConnection } from '../useStripeConnection';
import * as stripeConnectionQueries from '@/lib/queries/stripe-connection-queries';

// ── Mission réconciliation Stripe, point 3 (2026-08-20) ──
//
// Root cause confirmed: every backend endpoint that (re)connects Stripe
// (including update-stripe-connection, used here) triggers sync-stripe
// fire-and-forget (EdgeRuntime.waitUntil, never awaited before the HTTP
// response) — present since the endpoint's very first commit, not a
// regression of PR #90/#91. useUpdateStripeConnection's onSuccess never
// invalidated the Dashboard query at all before this fix, so a reconnect
// from Settings could leave the Overview page showing a stale-sync banner
// that had already resolved server-side by the time it was read. This test
// proves the fix: an immediate invalidation, plus a catch-up invalidation
// once the fire-and-forget sync has had time to actually finish.

vi.mock('@/lib/queries/stripe-connection-queries');

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { organization_id: 'org-1' } }),
}));

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function wrapperFor(queryClient: QueryClient) {
  return function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useUpdateStripeConnection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('invalidates the dashboard query immediately on success', async () => {
    vi.mocked(stripeConnectionQueries.updateStripeConnection).mockResolvedValue({
      success: true,
      mode: 'live',
      account_id: 'acct_123',
    });

    const queryClient = makeQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useUpdateStripeConnection(), { wrapper: wrapperFor(queryClient) });

    result.current.mutate('sk_live_xxx');
    await vi.waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['dashboard'] });
  });

  it('REGRESSION: schedules a catch-up dashboard invalidation ~10s later, to catch up with the fire-and-forget sync-stripe completion', async () => {
    vi.mocked(stripeConnectionQueries.updateStripeConnection).mockResolvedValue({
      success: true,
      mode: 'live',
      account_id: 'acct_123',
    });

    const queryClient = makeQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useUpdateStripeConnection(), { wrapper: wrapperFor(queryClient) });

    result.current.mutate('sk_live_xxx');
    await vi.waitFor(() => expect(result.current.isSuccess).toBe(true));

    const dashboardCallsBefore = invalidateSpy.mock.calls.filter(
      (call) => JSON.stringify(call[0]) === JSON.stringify({ queryKey: ['dashboard'] }),
    ).length;
    expect(dashboardCallsBefore).toBe(1); // only the immediate one so far

    await vi.advanceTimersByTimeAsync(10_000);

    const dashboardCallsAfter = invalidateSpy.mock.calls.filter(
      (call) => JSON.stringify(call[0]) === JSON.stringify({ queryKey: ['dashboard'] }),
    ).length;
    expect(dashboardCallsAfter).toBe(2); // immediate + catch-up
  });
});

describe('useDisconnectStripeConnection', () => {
  beforeEach(() => vi.clearAllMocks());

  it('invalidates the dashboard query on a successful disconnect', async () => {
    vi.mocked(stripeConnectionQueries.disconnectStripeConnection).mockResolvedValue({ success: true });

    const queryClient = makeQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useDisconnectStripeConnection(), { wrapper: wrapperFor(queryClient) });

    result.current.mutate();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['dashboard'] });
  });
});
