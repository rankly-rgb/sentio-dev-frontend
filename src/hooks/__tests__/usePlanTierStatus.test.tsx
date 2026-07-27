import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { usePlanTierStatus } from '../usePlanTierStatus';
import * as pricingQueries from '@/lib/queries/pricing-queries';
import * as AuthContext from '@/contexts/AuthContext';
import type { PricingStatus } from '@/lib/types/plan-tier';

vi.mock('@/lib/queries/pricing-queries');
vi.mock('@/contexts/AuthContext');

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('usePlanTierStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { organization_id: 'org-1' },
    } as unknown as ReturnType<typeof AuthContext.useAuth>);
  });

  it('reflects the loading state before data resolves (FR-008)', () => {
    vi.mocked(pricingQueries.getPricingStatus).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => usePlanTierStatus(), { wrapper });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('surfaces an error state rather than a guessed tier on fetch failure (FR-008)', async () => {
    vi.mocked(pricingQueries.getPricingStatus).mockRejectedValue(new Error('network error'));
    const { result } = renderHook(() => usePlanTierStatus(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });

  it('does not fetch when there is no organization_id', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({ user: null } as unknown as ReturnType<typeof AuthContext.useAuth>);
    renderHook(() => usePlanTierStatus(), { wrapper });
    expect(pricingQueries.getPricingStatus).not.toHaveBeenCalled();
  });

  it('passes through max_active_accounts: null (unlimited) without inventing a ratio', async () => {
    const status: PricingStatus = {
      plan_tier: 'enterprise',
      active_accounts_count: 900,
      max_active_accounts: null,
      usage_pct: null,
      alert_active: false,
      requires_appointment: true,
    };
    vi.mocked(pricingQueries.getPricingStatus).mockResolvedValue(status);

    const { result } = renderHook(() => usePlanTierStatus(), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.max_active_accounts).toBeNull();
    expect(result.current.data?.usage_pct).toBeNull();
  });
});
