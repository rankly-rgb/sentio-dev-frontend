import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TrialBanner from '../TrialBanner';
import type { TrialStatus } from '@/lib/types/trial';
import { en } from '@/i18n/en';

vi.mock('@/lib/i18n/useT', () => ({ useT: () => en }));

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
    expect(screen.getByText(/7 days remaining/)).toBeInTheDocument();
  });

  it('uses singular when 1 day remaining', () => {
    render(<TrialBanner trial={makeTrialStatus({ trial_days_remaining: 1 })} />);
    expect(screen.getByText(/1 day remaining/)).toBeInTheDocument();
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
    expect(screen.getByText(/Your trial has ended/)).toBeInTheDocument();
    expect(screen.getByText(/Upgrade to a paid plan/)).toBeInTheDocument();
  });

  it('renders upgrade link', () => {
    render(<TrialBanner trial={makeTrialStatus()} />);
    expect(screen.getByRole('link', { name: /upgrade/i })).toBeInTheDocument();
  });

  it('renders nothing for paid plans', () => {
    const { container } = render(
      <TrialBanner trial={makeTrialStatus({ plan_type: 'growth' })} />,
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
