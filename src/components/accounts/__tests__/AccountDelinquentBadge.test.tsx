import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import AccountDelinquentBadge from '../AccountDelinquentBadge';
import { en } from '@/i18n/en';

vi.mock('@/lib/i18n/useT', () => ({ useT: () => en }));

function renderBadge(props: { isDelinquent: boolean; delinquentSince: string | null }) {
  return render(
    <TooltipProvider>
      <AccountDelinquentBadge {...props} />
    </TooltipProvider>,
  );
}

// Lot 5 (backend, 2026-08-13) added delinquent_since/duration display — the
// backend changelog described this as already ported to the frontend, but
// as of 2026-08-23 the badge only ever rendered a bare "Past due" with no
// duration and no `delinquentSince` prop existed at all.
describe('AccountDelinquentBadge', () => {
  it('renders nothing when not delinquent', () => {
    const { container } = renderBadge({ isDelinquent: false, delinquentSince: null });
    expect(container).toBeEmptyDOMElement();
  });

  it('unknown duration (delinquentSince null): bare "Past due", not "Past due today"', () => {
    renderBadge({ isDelinquent: true, delinquentSince: null });
    expect(screen.getByText('Past due')).toBeInTheDocument();
  });

  it('known duration: shows the day count in the badge itself', () => {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 86_400_000).toISOString();
    renderBadge({ isDelinquent: true, delinquentSince: fourteenDaysAgo });
    expect(screen.getByText(/Past due · 14 days/)).toBeInTheDocument();
  });

  it('started today: "Past due · Past due today", not "· 0 days"', () => {
    renderBadge({ isDelinquent: true, delinquentSince: new Date().toISOString() });
    expect(screen.queryByText(/0 days/)).not.toBeInTheDocument();
  });
});
