import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TrialBanner from '../TrialBanner';
import type { TrialStatus } from '@/lib/types/trial';
import { fr } from '@/i18n/fr';

vi.mock('@/lib/i18n/useT', () => ({ useT: () => fr }));

function makeTrialStatus(overrides?: Partial<TrialStatus>): TrialStatus {
  return {
    plan_type: 'free',
    trial_ends_at: new Date(Date.now() + 7 * 86400_000).toISOString(),
    trial_days_remaining: 7,
    is_trial_active: true,
    is_trial_expired: false,
    ...overrides,
  };
}

describe('TrialBanner', () => {
  it('renders remaining days for active trial', () => {
    render(<TrialBanner trial={makeTrialStatus({ trial_days_remaining: 7 })} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/7 jours restants/)).toBeInTheDocument();
  });

  it('uses singular when 1 day remaining', () => {
    render(<TrialBanner trial={makeTrialStatus({ trial_days_remaining: 1 })} />);
    expect(screen.getByText(/1 jour restant/)).toBeInTheDocument();
  });

  it('renders expired state when trial is expired', () => {
    render(
      <TrialBanner
        trial={makeTrialStatus({
          trial_days_remaining: 0,
          is_trial_active: false,
          is_trial_expired: true,
        })}
      />,
    );
    expect(screen.getByText(/Votre essai est terminé/)).toBeInTheDocument();
    expect(screen.getByText(/Passez à un plan payant/)).toBeInTheDocument();
  });

  it('renders upgrade link', () => {
    render(<TrialBanner trial={makeTrialStatus()} />);
    expect(screen.getByRole('link', { name: /mettre à niveau/i })).toBeInTheDocument();
  });

  it('renders nothing for paid plans', () => {
    const { container } = render(
      <TrialBanner trial={makeTrialStatus({ plan_type: 'starter' })} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing for enterprise plan even if expired', () => {
    const { container } = render(
      <TrialBanner
        trial={makeTrialStatus({ plan_type: 'enterprise', is_trial_expired: true })}
      />,
    );
    expect(container.firstChild).toBeNull();
  });
});
