import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KpiCards } from '../kpi-cards';
import type { DashboardMetrics } from '@/types/dashboard';
import { en } from '@/i18n/en';

vi.mock('@/lib/i18n/useT', () => ({ useT: () => en }));

function makeMetrics(overrides?: Partial<DashboardMetrics>): DashboardMetrics {
  return {
    mrr_cents: 500000,
    arr_cents: 6000000,
    nrr_percentage: 105,
    total_accounts: 10,
    active_accounts: 8,
    accounts_at_risk: 2,
    accounts_at_risk_unpriced: 0,
    mrr_at_risk_cents: 100000,
    expansion_opportunities: 1,
    expansion_configured: true,
    avg_health_score: 72,
    avg_health_scored_accounts: 10,
    churn_rate: 2.5,
    currency: 'usd',
    stripe_stale: false,
    billing_profile: 'standard',
    mrr_unavailable_accounts: 0,
    ...overrides,
  };
}

describe('KpiCards — O10 unavailable-population captions (2026-08-19)', () => {
  it('shows no caption on MRR/Active accounts when unpriced accounts are a minority', () => {
    const metrics = makeMetrics({ total_accounts: 10, mrr_unavailable_accounts: 2 });
    render(<KpiCards metrics={metrics} />);

    expect(screen.queryByText(/have no computable MRR/)).not.toBeInTheDocument();
    expect(screen.queryByText(/not counted here/)).not.toBeInTheDocument();
  });

  it('REGRESSION: explains MRR when unpriced accounts are the majority — App\'Ines case (5-account org, 3 invoice-only)', () => {
    const metrics = makeMetrics({ total_accounts: 5, mrr_cents: 0, mrr_unavailable_accounts: 3 });
    render(<KpiCards metrics={metrics} />);

    expect(
      screen.getByText('3 of 5 accounts have no computable MRR (invoice-only billing or an unpriced currency) — the total above reflects only the rest.'),
    ).toBeInTheDocument();
  });

  it('REGRESSION: explains Active accounts when unpriced accounts are the majority, never silently "0"', () => {
    const metrics = makeMetrics({ total_accounts: 5, active_accounts: 0, mrr_unavailable_accounts: 3 });
    render(<KpiCards metrics={metrics} />);

    expect(
      screen.getByText('3 accounts not counted here — no computable MRR (invoice-only billing or an unpriced currency).'),
    ).toBeInTheDocument();
  });

  it('caption threshold is inclusive at exactly 50%', () => {
    const metrics = makeMetrics({ total_accounts: 4, mrr_unavailable_accounts: 2 });
    render(<KpiCards metrics={metrics} />);

    expect(screen.getByText(/2 of 4 accounts have no computable MRR/)).toBeInTheDocument();
  });

  it('shows the accounts-at-risk caption whenever any at-risk account is unpriced, regardless of majority', () => {
    // accounts_at_risk_unpriced is independent of the MRR/Active-accounts
    // majority threshold — it is never zero-truncated by design (audit
    // délinquence 2026-08-06), so a single unpriced at-risk account out of
    // a large portfolio still deserves the caption.
    const metrics = makeMetrics({ total_accounts: 100, mrr_unavailable_accounts: 1, accounts_at_risk: 5, accounts_at_risk_unpriced: 1 });
    render(<KpiCards metrics={metrics} />);

    expect(
      screen.getByText('1 of these have no computable MRR (invoice-only billing or an unpriced currency) — included here, not in MRR at risk.'),
    ).toBeInTheDocument();
  });

  it('shows no accounts-at-risk caption when accounts_at_risk_unpriced is 0', () => {
    const metrics = makeMetrics({ accounts_at_risk_unpriced: 0 });
    render(<KpiCards metrics={metrics} />);

    expect(screen.queryByText(/included here, not in MRR at risk/)).not.toBeInTheDocument();
  });

  it('never divides by zero when total_accounts is 0 (brand-new org, no captions shown)', () => {
    const metrics = makeMetrics({ total_accounts: 0, mrr_unavailable_accounts: 0, active_accounts: 0, accounts_at_risk: 0, mrr_cents: 0 });
    expect(() => render(<KpiCards metrics={metrics} />)).not.toThrow();
    expect(screen.queryByText(/have no computable MRR/)).not.toBeInTheDocument();
  });
});
