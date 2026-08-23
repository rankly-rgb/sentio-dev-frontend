import { describe, it, expect } from 'vitest';
import { churnBandStyle, CHURN_BAND_STYLE, delinquentDurationDays, formatDelinquentDuration } from '../scoring-display';

// Lot 5 (backend, 2026-08-13) added a 'critical' churn_risk_band for accounts
// past due 45+ days — the backend changelog described the frontend port as
// already done in the same lot, but as of 2026-08-23 nothing here recognized
// it: churnBandStyle('critical') fell through to CHURN_BAND_UNKNOWN_STYLE
// ("Unknown"), the least urgent-looking badge possible for the most urgent
// band there is. These tests lock in the fix.
describe('churnBandStyle', () => {
  it('critical: full-strength destructive fill, distinct from high', () => {
    const critical = churnBandStyle('critical');
    const high = churnBandStyle('high');
    expect(critical.label).toBe('Critical');
    expect(critical.color).not.toBe(high.color);
    expect(critical.color).not.toContain('/15'); // full fill, not the /15 opacity variant 'high' uses
  });

  it('does not fall back to the Unknown style for critical', () => {
    expect(CHURN_BAND_STYLE.critical).toBeDefined();
    expect(churnBandStyle('critical').label).not.toBe('Unknown');
  });

  it('still handles the pre-existing bands correctly', () => {
    expect(churnBandStyle('low').label).toBe('Low');
    expect(churnBandStyle('watch').label).toBe('Watch');
    expect(churnBandStyle('high').label).toBe('High');
    expect(churnBandStyle('churned').label).toBe('Churned');
  });

  it('null/undefined → Not scored; a genuinely unrecognized value → Unknown', () => {
    expect(churnBandStyle(null).label).toBe('Not scored');
    expect(churnBandStyle(undefined).label).toBe('Not scored');
    expect(churnBandStyle('not-a-real-band').label).toBe('Unknown');
  });
});

describe('delinquentDurationDays', () => {
  const now = new Date('2026-08-23T12:00:00Z');

  it('null in, null out — never fabricates a duration', () => {
    expect(delinquentDurationDays(null, now)).toBeNull();
  });

  it('computes whole days elapsed', () => {
    expect(delinquentDurationDays('2026-08-09T12:00:00Z', now)).toBe(14);
    expect(delinquentDurationDays('2026-07-09T12:00:00Z', now)).toBe(45);
  });

  it('never returns a negative number for a since-date in the future', () => {
    expect(delinquentDurationDays('2026-08-24T12:00:00Z', now)).toBe(0);
  });
});

describe('formatDelinquentDuration', () => {
  it('null → em dash, never "0 days" (unknown duration ≠ started today)', () => {
    expect(formatDelinquentDuration(null)).toBe('—');
  });

  it('0 → explicit "today", not "0 days"', () => {
    expect(formatDelinquentDuration(0)).toBe('Past due today');
  });

  it('1 → singular', () => {
    expect(formatDelinquentDuration(1)).toBe('1 day');
  });

  it('plural for 2+', () => {
    expect(formatDelinquentDuration(14)).toBe('14 days');
    expect(formatDelinquentDuration(45)).toBe('45 days');
  });
});
