import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { relativeTimeFr, monthsSince } from '../account-detail-helpers';

// account-detail-helpers.ts was trimmed down to just these two functions in
// Étape 4 (chore/etape4-frontend-cleanup) — neither had test coverage
// before this pass (Étape 6 QA). Both compare against `Date.now()`/`new
// Date()` internally, so tests fix the clock with vi.useFakeTimers rather
// than relying on wall-clock time (flaky-by-construction otherwise).
describe('relativeTimeFr', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-23T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('less than a minute ago → "just now"', () => {
    expect(relativeTimeFr(new Date('2026-08-23T11:59:31Z').toISOString())).toBe('just now');
  });

  it('minutes ago → "N min ago"', () => {
    expect(relativeTimeFr(new Date('2026-08-23T11:45:00Z').toISOString())).toBe('15 min ago');
  });

  it('hours ago → "Nh ago"', () => {
    expect(relativeTimeFr(new Date('2026-08-23T06:00:00Z').toISOString())).toBe('6h ago');
  });

  it('days ago (under a month) → "Nd ago"', () => {
    expect(relativeTimeFr(new Date('2026-08-15T12:00:00Z').toISOString())).toBe('8d ago');
  });

  it('months ago (under a year) → "N mo ago"', () => {
    expect(relativeTimeFr(new Date('2026-05-23T12:00:00Z').toISOString())).toBe('3 mo ago');
  });

  it('a year or more ago → "Ny ago"', () => {
    expect(relativeTimeFr(new Date('2024-08-23T12:00:00Z').toISOString())).toBe('2y ago');
  });
});

describe('monthsSince', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-23T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('less than a month → "less than a month"', () => {
    expect(monthsSince(new Date('2026-08-01T00:00:00Z').toISOString())).toBe('less than a month');
  });

  it('exactly 1 month → singular', () => {
    expect(monthsSince(new Date('2026-07-23T00:00:00Z').toISOString())).toBe('1 month');
  });

  it('multiple months → plural, count based on calendar months elapsed', () => {
    expect(monthsSince(new Date('2026-05-23T00:00:00Z').toISOString())).toBe('3 months');
  });

  it('crosses a year boundary correctly', () => {
    expect(monthsSince(new Date('2025-08-23T00:00:00Z').toISOString())).toBe('12 months');
  });
});
