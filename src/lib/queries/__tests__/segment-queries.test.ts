import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSegmentFilter } from '../segment-queries';
import type { AccountListItem } from '@/lib/types/accounts';

type Fixture = Pick<AccountListItem, 'primary_segment' | 'created_at'>;

function account(overrides: Partial<Fixture> = {}): Fixture {
  return {
    primary_segment: 'stables',
    created_at: '2020-01-01T00:00:00Z',
    ...overrides,
  };
}

// getSegmentFilter is the sole source of segment membership on the client
// (docs comment in segment-queries.ts: primary_segment is read verbatim
// from the backend segmentation cron, never recomputed here) — this was
// untested before Étape 6 QA.
describe('getSegmentFilter', () => {
  describe('nouveaux (the one non-primary_segment-based case)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-08-23T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('matches an account created under 90 days ago, regardless of primary_segment', () => {
      const filter = getSegmentFilter('nouveaux');
      const acc = account({ primary_segment: 'champions', created_at: '2026-07-23T12:00:00Z' }); // 31 days ago
      expect(filter(acc)).toBe(true);
    });

    it('does not match an account created 90+ days ago', () => {
      const filter = getSegmentFilter('nouveaux');
      const acc = account({ created_at: '2026-01-01T00:00:00Z' });
      expect(filter(acc)).toBe(false);
    });

    it('does not match right at the 90-day boundary', () => {
      const filter = getSegmentFilter('nouveaux');
      const exactlyNinetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
      expect(filter(account({ created_at: exactlyNinetyDaysAgo }))).toBe(false);
    });

    it('does not match an account with an empty/falsy created_at (never fabricates a match)', () => {
      const filter = getSegmentFilter('nouveaux');
      expect(filter(account({ created_at: '' }))).toBe(false);
    });
  });

  describe('primary_segment equality (all other segments)', () => {
    it('matches on exact primary_segment equality', () => {
      const filter = getSegmentFilter('en_danger_critique');
      expect(filter(account({ primary_segment: 'en_danger_critique' }))).toBe(true);
      expect(filter(account({ primary_segment: 'a_risque_leger' }))).toBe(false);
    });

    it('donnees_insuffisantes is a plain equality check like any other segment', () => {
      const filter = getSegmentFilter('donnees_insuffisantes');
      expect(filter(account({ primary_segment: 'donnees_insuffisantes' }))).toBe(true);
      expect(filter(account({ primary_segment: 'stables' }))).toBe(false);
    });

    it('en_expansion is a plain equality check with no special-casing — it just never finds a real match because the backend no longer assigns it (merged into champions)', () => {
      const filter = getSegmentFilter('en_expansion');
      // The filter itself has no hardcoded exclusion for this segment: given
      // an account that literally carries this primary_segment (never
      // produced by real backend data since the merge into `champions`,
      // §4bis), it still matches — proving the "never matches in practice"
      // guarantee comes from the backend data invariant, not from this
      // function silently special-casing the segment.
      expect(filter(account({ primary_segment: 'en_expansion' }))).toBe(true);
      expect(filter(account({ primary_segment: 'champions' }))).toBe(false);
    });
  });
});
