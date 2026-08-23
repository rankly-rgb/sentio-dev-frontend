import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

  // Escalation note branches (FLOOR_HIGH_MIN_DAYS/FLOOR_CRITICAL_MIN_DAYS,
  // mirroring the backend's applyDelinquencyBandFloor thresholds) — none of
  // the three branches (below floor, High floor, Critical floor) had
  // coverage before this pass (Étape 6 QA). Radix only mounts
  // TooltipContent once the tooltip is actually open (data-state="closed"
  // otherwise, confirmed empirically — getByText fails against the closed
  // tree), and focusing the trigger opens it synchronously (no hover-delay
  // wait needed, same accessibility behavior a keyboard user gets).
  describe('escalation note in the tooltip', () => {
    function daysAgoIso(days: number): string {
      return new Date(Date.now() - days * 86_400_000).toISOString();
    }

    function openTooltip() {
      fireEvent.focus(screen.getByText(/Past due/));
    }

    // Radix renders the tooltip text twice once open (a visible node plus a
    // visually-hidden `role="tooltip"` duplicate for screen readers), so
    // presence checks use getAllByText(...)[0] rather than getByText, which
    // throws on more than one match.
    it('below the High floor (< 15 days): no escalation note', async () => {
      renderBadge({ isDelinquent: true, delinquentSince: daysAgoIso(10) });
      openTooltip();
      await waitFor(() => expect(screen.getAllByText(/A payment issue isn't the same as leaving/i)[0]).toBeInTheDocument());
      expect(screen.queryByText(/floored at High/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/floored at Critical/i)).not.toBeInTheDocument();
    });

    it('at the High floor (15+ days, under 45): shows the High escalation note', async () => {
      renderBadge({ isDelinquent: true, delinquentSince: daysAgoIso(15) });
      openTooltip();
      await waitFor(() => expect(screen.getAllByText(/floored at High/i)[0]).toBeInTheDocument());
      expect(screen.queryByText(/floored at Critical/i)).not.toBeInTheDocument();
    });

    it('at the Critical floor (45+ days): shows the Critical escalation note, not the High one', async () => {
      renderBadge({ isDelinquent: true, delinquentSince: daysAgoIso(45) });
      openTooltip();
      await waitFor(() => expect(screen.getAllByText(/floored at Critical/i)[0]).toBeInTheDocument());
      expect(screen.queryByText(/floored at High/i)).not.toBeInTheDocument();
    });

    it('unknown duration (delinquentSince null): never claims a floor', async () => {
      renderBadge({ isDelinquent: true, delinquentSince: null });
      openTooltip();
      await waitFor(() => expect(screen.getAllByText(/A payment issue isn't the same as leaving/i)[0]).toBeInTheDocument());
      expect(screen.queryByText(/floored at High/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/floored at Critical/i)).not.toBeInTheDocument();
    });
  });
});
