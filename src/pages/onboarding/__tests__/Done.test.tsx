import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Done from '../Done';
import { en } from '@/i18n/en';
import type { OnboardingFirstWin } from '@/lib/types/onboarding-flow';

vi.mock('@/lib/i18n/useT', () => ({ useT: () => en }));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { currency: 'usd' } }) }));

const mockMarkField = vi.fn();
vi.mock('@/hooks/useOnboardingFlow', () => ({
  useOnboardingFirstWin: () => mockUseOnboardingFirstWin(),
  useMarkOnboardingField: () => ({ mutate: mockMarkField, isPending: false }),
}));

let mockUseOnboardingFirstWin: () => { data: OnboardingFirstWin | undefined; isPending: boolean };

// Regression test for the envelope-unwrap crash: once useOnboardingFirstWin
// correctly unwraps {data: ...}, `firstWin` here is the real flat shape and
// at_risk_accounts is genuinely an array — this used to throw
// (`Cannot read properties of undefined (reading 'length')`) whenever the
// backend had already scored at least one real account.
describe('Done — real scored-account data', () => {
  it('renders without crashing and shows the correct at-risk count', () => {
    mockUseOnboardingFirstWin = () => ({
      data: {
        total_accounts: 6,
        at_risk_accounts: [
          {
            stripe_customer_id: 'cus_1',
            display_name: 'Acme',
            health_score: 22,
            churn_risk: 88,
            mrr: 49900,
            top_risk_reason: 'Invoice overdue',
          },
          {
            stripe_customer_id: 'cus_2',
            display_name: 'Nexio',
            health_score: 35,
            churn_risk: 70,
            mrr: 11000,
            top_risk_reason: 'MRR contraction',
          },
        ],
        mrr_at_risk: 60900,
        global_health_score: 61,
      },
      isPending: false,
    });

    expect(() => render(<Done />)).not.toThrow();

    // Two "2"s render: the KPI tile and the account count are both derived
    // from the same at_risk_accounts array.
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Acme')).toBeInTheDocument();
  });

  // Reproduces the exact pre-fix hook bug directly: a truthy but wrongly-
  // shaped object (the un-unwrapped {data: ...} envelope), where
  // at_risk_accounts is undefined even though `firstWin` itself is present.
  it('does not crash if at_risk_accounts is ever missing on a present object', () => {
    mockUseOnboardingFirstWin = () => ({
      data: {} as OnboardingFirstWin,
      isPending: false,
    });

    expect(() => render(<Done />)).not.toThrow();
  });

  it('renders the honest empty state when there are genuinely zero at-risk accounts', () => {
    mockUseOnboardingFirstWin = () => ({
      data: {
        total_accounts: 4,
        at_risk_accounts: [],
        mrr_at_risk: 0,
        global_health_score: 88,
      },
      isPending: false,
    });

    render(<Done />);

    expect(screen.getByText('No at-risk accounts detected!')).toBeInTheDocument();
  });
});
