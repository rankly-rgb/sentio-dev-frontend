import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useConnectStripeApiKey } from '../useIntegrations';
import * as integrationQueries from '@/lib/queries/integration-queries';

// ── Mission réconciliation Stripe, point 3 (2026-08-20) ──
// Same root cause and fix as useStripeConnection.test.tsx: this endpoint
// (integration-oauth/stripe/api-key) also triggers sync-stripe
// fire-and-forget, and useConnectStripeApiKey's onSuccess never invalidated
// the Dashboard query before this fix.

vi.mock('@/lib/queries/integration-queries');
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

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

describe('useConnectStripeApiKey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('invalidates the dashboard query immediately, then again ~10s later (fire-and-forget sync catch-up)', async () => {
    vi.mocked(integrationQueries.connectStripeApiKey).mockResolvedValue({
      success: true,
      account_id: 'acct_123',
      account_name: 'Acme Inc',
      integration_method: 'api_key',
      message: 'Connected',
    });

    const queryClient = makeQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useConnectStripeApiKey(), { wrapper: wrapperFor(queryClient) });

    result.current.mutate('sk_live_xxx');
    await vi.waitFor(() => expect(result.current.isSuccess).toBe(true));

    const dashboardCalls = () =>
      invalidateSpy.mock.calls.filter((call) => JSON.stringify(call[0]) === JSON.stringify({ queryKey: ['dashboard'] })).length;

    expect(dashboardCalls()).toBe(1);

    await vi.advanceTimersByTimeAsync(10_000);

    expect(dashboardCalls()).toBe(2);
  });
});
