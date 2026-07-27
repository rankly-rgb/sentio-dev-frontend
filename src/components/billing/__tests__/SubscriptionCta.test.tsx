import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SubscriptionCta from '../SubscriptionCta';
import { en } from '@/i18n/en';
import * as usePlanTierStatusModule from '@/hooks/usePlanTierStatus';
import * as useSubscribeToPlanModule from '@/hooks/useSubscribeToPlan';
import type { PricingStatus, SubscribeToPlanResult } from '@/lib/types/plan-tier';

vi.mock('@/lib/i18n/useT', () => ({ useT: () => en }));
vi.mock('@/hooks/usePlanTierStatus');
vi.mock('@/hooks/useSubscribeToPlan');

function mockStatus(overrides: Partial<PricingStatus> = {}) {
  const data: PricingStatus = {
    plan_tier: 'free',
    active_accounts_count: 10,
    max_active_accounts: 30,
    usage_pct: 33,
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

function mockSubscribeMutation(mutate: ReturnType<typeof vi.fn>, overrides: Record<string, unknown> = {}) {
  vi.mocked(useSubscribeToPlanModule.useSubscribeToPlan).mockReturnValue({
    mutate,
    isPending: false,
    isError: false,
    ...overrides,
  } as unknown as ReturnType<typeof useSubscribeToPlanModule.useSubscribeToPlan>);
}

describe('SubscriptionCta', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    import.meta.env.VITE_APPOINTMENT_BOOKING_URL = 'https://example.com/book';
  });

  // US2 — Acceptance Scenario 1: self-serve only, no call proposal, off the Stripe screen
  it('renders only a self-serve CTA for Free off the Stripe-connect screen, no call proposal', () => {
    mockStatus({ plan_tier: 'free', requires_appointment: false });
    mockSubscribeMutation(vi.fn());
    render(<SubscriptionCta />);

    expect(screen.getByText(en.pricingTiers.upgradeToGrowth)).toBeInTheDocument();
    expect(screen.queryByText(en.pricingTiers.callProposalTitle)).not.toBeInTheDocument();
    expect(screen.queryByText(en.pricingTiers.requestMeeting)).not.toBeInTheDocument();
  });

  // US2 — Acceptance Scenario 2: call proposal appears alongside self-serve on the Stripe screen
  it('renders the call proposal alongside the self-serve CTA on the Stripe-connect screen', () => {
    mockStatus({ plan_tier: 'growth', requires_appointment: false });
    mockSubscribeMutation(vi.fn());
    render(<SubscriptionCta context="stripe-connect" />);

    expect(screen.getByText(en.pricingTiers.downgradeToFree)).toBeInTheDocument();
    expect(screen.getByText(en.pricingTiers.callProposalTitle)).toBeInTheDocument();
  });

  // US3 — Acceptance Scenario 1: Scale/Enterprise only ever see the RDV CTA, everywhere,
  // including the Stripe-connect screen (overrides the US2 call proposal for this tier)
  it('renders only the "request a meeting" CTA for Scale/Enterprise, even on the Stripe-connect screen', () => {
    mockStatus({ plan_tier: 'scale', requires_appointment: true });
    mockSubscribeMutation(vi.fn());
    render(<SubscriptionCta context="stripe-connect" />);

    expect(screen.getByText(en.pricingTiers.requestMeeting)).toBeInTheDocument();
    expect(screen.queryByText(en.pricingTiers.upgradeToGrowth)).not.toBeInTheDocument();
    expect(screen.queryByText(en.pricingTiers.callProposalTitle)).not.toBeInTheDocument();
  });

  it('gates the RDV branch purely on requires_appointment, never on plan_tier locally (FR-007)', () => {
    // An org already on "growth" but flagged requires_appointment by the API must still
    // only ever see the RDV CTA — this must never be derived from plan_tier client-side
    mockStatus({ plan_tier: 'growth', requires_appointment: true });
    mockSubscribeMutation(vi.fn());
    render(<SubscriptionCta />);

    expect(screen.getByText(en.pricingTiers.requestMeeting)).toBeInTheDocument();
    expect(screen.queryByText(en.pricingTiers.downgradeToFree)).not.toBeInTheDocument();
  });

  it('shows an explicit error state rather than defaulting to either CTA on fetch failure', () => {
    vi.mocked(usePlanTierStatusModule.usePlanTierStatus).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('network error'),
    } as unknown as ReturnType<typeof usePlanTierStatusModule.usePlanTierStatus>);
    mockSubscribeMutation(vi.fn());
    render(<SubscriptionCta />);

    expect(screen.getByText(en.pricingTiers.loadError)).toBeInTheDocument();
    expect(screen.queryByText(en.pricingTiers.upgradeToGrowth)).not.toBeInTheDocument();
    expect(screen.queryByText(en.pricingTiers.requestMeeting)).not.toBeInTheDocument();
  });

  // Core of this task: clicking "Upgrade to Growth" calls the real endpoint, and since the
  // contract's implementation can never return a completable payment today (no
  // client_secret/Checkout URL), the button must be replaced by an explicit
  // "not available yet" state — never look like it worked with nothing behind it
  it('calls subscribeToPlan("growth") on click and shows the "coming soon" state instead of a fake success when status is not "active"', async () => {
    mockStatus({ plan_tier: 'free' });
    const mutate = vi.fn((_tier: string, opts?: { onSuccess?: (r: SubscribeToPlanResult) => void }) => {
      opts?.onSuccess?.({
        organization_id: 'org-1',
        plan_tier: 'growth',
        status: 'incomplete',
        current_period_end: null,
      });
    });
    mockSubscribeMutation(mutate);
    render(<SubscriptionCta />);

    fireEvent.click(screen.getByText(en.pricingTiers.upgradeToGrowth));

    expect(mutate).toHaveBeenCalledWith('growth', expect.anything());
    await waitFor(() => expect(screen.getByText(en.pricingTiers.upgradePendingTitle)).toBeInTheDocument());
    expect(screen.getByText(en.pricingTiers.upgradePendingBody)).toBeInTheDocument();
    // The upgrade button must not remain visible looking clickable/functional once we know
    // it cannot complete a payment
    expect(screen.queryByText(en.pricingTiers.upgradeToGrowth)).not.toBeInTheDocument();
  });

  it('downgrading to Free is a fully real, immediately-completable action per the contract (status: "active")', async () => {
    mockStatus({ plan_tier: 'growth' });
    const mutate = vi.fn((_tier: string, opts?: { onSuccess?: (r: SubscribeToPlanResult) => void }) => {
      opts?.onSuccess?.({ organization_id: 'org-1', plan_tier: 'free', status: 'active' });
    });
    mockSubscribeMutation(mutate);
    render(<SubscriptionCta />);

    fireEvent.click(screen.getByText(en.pricingTiers.downgradeToFree));

    expect(mutate).toHaveBeenCalledWith('free', expect.anything());
    await waitFor(() => expect(screen.getByText(en.pricingTiers.downgradeSuccess)).toBeInTheDocument());
  });
});
