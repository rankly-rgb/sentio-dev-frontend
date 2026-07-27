import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PlanTierProgress from '../PlanTierProgress';
import { en } from '@/i18n/en';
import * as usePlanTierStatusModule from '@/hooks/usePlanTierStatus';
import type { PricingStatus } from '@/lib/types/plan-tier';

vi.mock('@/lib/i18n/useT', () => ({ useT: () => en }));
vi.mock('@/hooks/usePlanTierStatus');

function mockStatus(overrides: Partial<PricingStatus> = {}) {
  const data: PricingStatus = {
    plan_tier: 'growth',
    active_accounts_count: 42,
    max_active_accounts: 50,
    usage_pct: 84,
    alert_active: false,
    requires_appointment: false,
    ...overrides,
  };
  vi.mocked(usePlanTierStatusModule.usePlanTierStatus).mockReturnValue({
    data,
    isLoading: false,
    error: null,
  } as unknown as ReturnType<typeof usePlanTierStatusModule.usePlanTierStatus>);
  return data;
}

describe('PlanTierProgress', () => {
  it('shows the tier name and a "N / limit" ratio (Acceptance Scenario 1)', () => {
    mockStatus({ active_accounts_count: 42, max_active_accounts: 50 });
    render(<PlanTierProgress />);

    expect(screen.getByText('Growth')).toBeInTheDocument();
    expect(screen.getByText('42 / 50 accounts tracked')).toBeInTheDocument();
  });

  it('shows "Unlimited" instead of a ratio when max_active_accounts is null (Acceptance Scenario 2)', () => {
    mockStatus({ plan_tier: 'enterprise', max_active_accounts: null, usage_pct: null });
    render(<PlanTierProgress />);

    expect(screen.getByText('Unlimited accounts')).toBeInTheDocument();
    expect(screen.queryByText(/accounts tracked/)).not.toBeInTheDocument();
  });

  it('shows an explicit error message rather than a default tier on fetch failure (FR-008)', () => {
    vi.mocked(usePlanTierStatusModule.usePlanTierStatus).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('network error'),
    } as unknown as ReturnType<typeof usePlanTierStatusModule.usePlanTierStatus>);
    render(<PlanTierProgress />);

    expect(screen.getByText(en.pricingTiers.loadError)).toBeInTheDocument();
  });
});
