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

describe('fr.format.mrrUnavailableReason — mission réconciliation Stripe, point 2 (2026-08-20)', () => {
  it('renders a distinct message for no_subscription_data + billing_model=invoice_only (App\'Ines case)', () => {
    const result = en.format.mrrUnavailableReason(0, 'usd', true, 'no_subscription_data', 'invoice_only');
    expect(result.toLowerCase()).toContain('invoice-only');
  });

  it('renders a distinct message for no_subscription_data + billing_model=subscription (never synced, not invoice-only)', () => {
    const result = en.format.mrrUnavailableReason(0, 'usd', true, 'no_subscription_data', 'subscription');
    expect(result.toLowerCase()).not.toContain('invoice-only');
    expect(result.toLowerCase()).toContain('no billing data');
  });

  it('renders a distinct message for unsupported_pricing, mentions usage-based', () => {
    const result = en.format.mrrUnavailableReason(0, 'usd', true, 'unsupported_pricing', 'subscription');
    expect(result.toLowerCase()).toContain('usage-based');
  });

  it('renders a distinct message for currency_mismatch, mentions currency', () => {
    const result = en.format.mrrUnavailableReason(0, 'usd', true, 'currency_mismatch', 'subscription');
    expect(result.toLowerCase()).toContain('currency');
  });

  it('the 3 real reasons produce 3 mutually distinct strings — no accidental collision', () => {
    const noSub = en.format.mrrUnavailableReason(0, 'usd', true, 'no_subscription_data', 'subscription');
    const pricing = en.format.mrrUnavailableReason(0, 'usd', true, 'unsupported_pricing', 'subscription');
    const currency = en.format.mrrUnavailableReason(0, 'usd', true, 'currency_mismatch', 'subscription');
    expect(new Set([noSub, pricing, currency]).size).toBe(3);
  });

  it('falls back to the generic text when reason is null despite isUnavailable=true (should not occur in practice, but never crashes)', () => {
    const result = en.format.mrrUnavailableReason(0, 'usd', true, null, 'subscription');
    expect(result).toContain('Not billable');
  });

  it('renders a normal currency figure when MRR is available, ignoring reason entirely', () => {
    expect(en.format.mrrUnavailableReason(49900, 'usd', false, 'unsupported_pricing', 'subscription')).toBe('$499.00');
  });

  it('a churned account (mrr_status=ok, reason=null) never hits the unavailable branch', () => {
    // aggregateAccountMrr returns mrr_status='ok'/mrr_unavailable_reason=null
    // for a churned account (_shared/mrr-engine.ts) — isUnavailable=false is
    // what a real call site passes for it, verified here for the $0 case.
    expect(en.format.mrrUnavailableReason(0, 'usd', false, null, 'subscription')).toBe('$0.00');
  });

  // ── Mission réconciliation Stripe, point 4 (2026-08-20) ──
  // billing_model='invoice_only' + mrr_status='ok' can only occur via the
  // new invoice-derived MRR fallback (estimateInvoiceOnlyMrr) — before this
  // point, invoice_only always meant mrr_status='unavailable'.

  it('REGRESSION: an invoice-only account with an available MRR estimate is visually marked "(estimated from invoices)"', () => {
    const result = en.format.mrrUnavailableReason(29900, 'usd', false, null, 'invoice_only');
    expect(result).toContain('$299.00');
    expect(result).toContain('estimated from invoices');
  });

  it('a subscription-backed account with an available MRR is never marked as estimated', () => {
    const result = en.format.mrrUnavailableReason(29900, 'usd', false, null, 'subscription');
    expect(result).toBe('$299.00');
    expect(result).not.toContain('estimated');
  });
});
