import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useOnboardingFlowStatus, useOnboardingFirstWin } from '../useOnboardingFlow';
import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';
import type { OnboardingFlowStatus, OnboardingFirstWin } from '@/lib/types/onboarding-flow';

vi.mock('@/lib/fetchWithUserJwt');

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { organization_id: 'org-1' } }),
}));

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

// Both onboarding-status and onboarding-first-win return { data: {...} }
// (jsonResponse's own convention, matched everywhere else via .data — see
// benchmark-queries.ts, useIntegrationsConfig). These two hooks typed their
// query result as the flat inner shape without ever unwrapping .data, so
// every field read off them was `undefined` at runtime — silently, since
// fetchWithUserJwt<T>() is a type assertion, not a runtime check.
describe('useOnboardingFlowStatus', () => {
  beforeEach(() => vi.clearAllMocks());

  it('unwraps the {data: ...} envelope — onboarding_completed is readable', async () => {
    const flowStatus: OnboardingFlowStatus = {
      stripe_connected: true,
      stripe_sync_completed: true,
      stripe_sync_in_progress: false,
      hubspot_connected: false,
      first_win_seen: false,
      onboarding_completed: false,
      current_step: 'stripe',
      accounts_count: 4,
      at_risk_count: 1,
    };
    vi.mocked(fetchWithUserJwt).mockResolvedValue({ data: flowStatus });

    const { result } = renderHook(() => useOnboardingFlowStatus(), { wrapper });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.onboarding_completed).toBe(false);
    expect(result.current.data?.current_step).toBe('stripe');
  });
});

describe('useOnboardingFirstWin', () => {
  beforeEach(() => vi.clearAllMocks());

  it('unwraps the {data: ...} envelope — at_risk_accounts is a real array', async () => {
    const firstWin: OnboardingFirstWin = {
      total_accounts: 12,
      at_risk_accounts: [
        {
          stripe_customer_id: 'cus_1',
          display_name: 'Acme',
          health_score: 22,
          churn_risk: 88,
          mrr: 49900,
          top_risk_reason: 'Invoice overdue',
        },
      ],
      mrr_at_risk: 49900,
      global_health_score: 61,
    };
    vi.mocked(fetchWithUserJwt).mockResolvedValue({ data: firstWin });

    const { result } = renderHook(() => useOnboardingFirstWin(), { wrapper });

    await waitFor(() => expect(result.current.data).toBeDefined());
    // The bug: without unwrapping, at_risk_accounts is undefined here —
    // Done.tsx's unguarded `.length` access on it is what crashes.
    expect(result.current.data?.at_risk_accounts).toHaveLength(1);
    expect(result.current.data?.total_accounts).toBe(12);
    expect(result.current.data?.global_health_score).toBe(61);
  });
});
