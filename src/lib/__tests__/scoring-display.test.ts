import { describe, it, expect } from 'vitest';
import { delinquentDurationDays, formatDelinquentDuration } from '@/lib/scoring-display';

// Lot 5 (2026-08-13, #35) — delinquentSince=null must never read as "0 days"
// (S1, no data ≠ neutral data): a fresh delinquency and an unknown date are
// not the same thing, and collapsing them to the same display would be a
// fabricated "started today" the backend never actually wrote.

describe('delinquentDurationDays', () => {
  it('returns null when delinquentSince is null', () => {
    expect(delinquentDurationDays(null)).toBeNull();
  });

  it('computes whole days between delinquentSince and now', () => {
    const now = new Date('2026-08-13T00:00:00Z').getTime();
    expect(delinquentDurationDays('2026-06-14', now)).toBe(60);
  });

  it('returns 0 for a delinquency that started today — distinct from the null case', () => {
    const now = new Date('2026-08-13T00:00:00Z').getTime();
    expect(delinquentDurationDays('2026-08-13', now)).toBe(0);
  });
});

describe('formatDelinquentDuration', () => {
  it('renders "—" for a null delinquentSince, never "0 days"', () => {
    expect(formatDelinquentDuration(null)).toBe('—');
  });

  it('renders singular "1 day"', () => {
    const now = new Date('2026-08-13T00:00:00Z').getTime();
    expect(formatDelinquentDuration('2026-08-12', now)).toBe('1 day');
  });

  it('renders plural "N days"', () => {
    const now = new Date('2026-08-13T00:00:00Z').getTime();
    expect(formatDelinquentDuration('2026-06-14', now)).toBe('60 days');
  });
});
