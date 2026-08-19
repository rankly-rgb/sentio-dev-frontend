import { describe, it, expect } from 'vitest';
import { en } from '../en';

describe('fr.format.mrrOrUnavailable — O10 cause-neutral wording (2026-08-19)', () => {
  it('REGRESSION: no longer renders a bare "Not billable" — must not read as "this client doesn\'t pay"', () => {
    // App'Ines case (backend #88): an account with 17 months of consistent
    // paid invoices, mrr_status='unavailable' purely because it has no
    // Stripe Subscription object (invoice-only billing). The bare string
    // read as "this customer doesn't pay", which was the actual complaint.
    const result = en.format.mrrOrUnavailable(0, 'usd', true);
    expect(result).not.toBe('Not billable');
    expect(result).toContain('Not billable');
    expect(result.toLowerCase()).toContain('limitation');
  });

  it('does not name a specific cause — "invoice-only" would be wrong for the other real cause (minority currency)', () => {
    const result = en.format.mrrOrUnavailable(0, 'usd', true);
    expect(result.toLowerCase()).not.toContain('invoice');
    expect(result.toLowerCase()).not.toContain('currency');
    expect(result.toLowerCase()).not.toContain('subscription');
  });

  it('still renders a normal currency figure when MRR is available', () => {
    expect(en.format.mrrOrUnavailable(49900, 'usd', false)).toBe('$499.00');
  });

  it('currency figure ignores isUnavailable=false regardless of cents value, including zero', () => {
    // A genuine $0 MRR (e.g. a zero-dollar active plan) must still render
    // as a real currency figure, not the unavailable message — isUnavailable
    // is the only signal that should switch branches.
    expect(en.format.mrrOrUnavailable(0, 'usd', false)).toBe('$0.00');
  });
});
