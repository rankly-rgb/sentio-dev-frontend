import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import StripeConnect from '../StripeConnect';
import { en } from '@/i18n/en';
import type { OnboardingStatusResponse } from '@/lib/types/onboarding-wizard';

vi.mock('@/lib/i18n/useT', () => ({ useT: () => en }));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

const mockVerify = { mutateAsync: vi.fn(), isPending: false };
const mockOAuthInitiate = { mutateAsync: vi.fn(), isPending: false };

vi.mock('@/hooks/useOnboardingWizard', () => ({
  useOnboardingStatusFull: () => ({
    data: {
      data: {
        stripe_connected: false,
        stripe_sync_in_progress: false,
        hubspot_connected: false,
        first_score_calculated: false,
        aha_moment_ready: false,
        aha_moment_seen: false,
        onboarding_completed: false,
        current_step: 'stripe',
        wizard_steps: [],
        accounts_count: 0,
        at_risk_count: 0,
        top_risk_account: null,
      },
    } satisfies OnboardingStatusResponse,
    isLoading: false,
  }),
  useVerifyStripeToken: () => mockVerify,
  useStripeOAuthInitiate: () => mockOAuthInitiate,
}));

// Beta cohort decision (2026-08-17, script testeur bêta §2): only the API key
// connection path is offered. OAuth Stripe Connect must be absent from the DOM,
// not merely undocumented — a curious tester can still click a hidden-by-doc-only tab.
describe('StripeConnect — beta cohort: API key only', () => {
  it('renders the API Key tab', () => {
    render(<StripeConnect />);
    expect(screen.getByRole('button', { name: 'API Key (recommended)' })).toBeInTheDocument();
  });

  it('never renders the OAuth tab or its panel content', () => {
    render(<StripeConnect />);
    expect(screen.queryByRole('button', { name: 'OAuth Stripe Connect' })).not.toBeInTheDocument();
    expect(screen.queryByText('Prefer to authorize via your Stripe account?')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Connect via Stripe OAuth' })).not.toBeInTheDocument();
  });
});
