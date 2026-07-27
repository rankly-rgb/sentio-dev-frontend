// Per API_CONTRACTS.md § "Pricing & Billing" 8.1 — do not reuse `PlanType` from
// `src/lib/types/trial.ts` as-is: it still has `'starter'` (removed here) and lacks `'scale'`.
export type PlanTier = 'free' | 'growth' | 'scale' | 'enterprise';

export interface PricingStatus {
  plan_tier: PlanTier;
  active_accounts_count: number;
  max_active_accounts: number | null; // null = unlimited
  usage_pct: number | null; // null if unlimited, can exceed 100
  alert_active: boolean;
  requires_appointment: boolean;
}

// § 8.3 — POST /sentio-billing/subscribe. Only 'free' and 'growth' are valid targets;
// 'scale'/'enterprise' are appointment-only and return 403 (never sent from this app).
export type SelfServeTargetTier = 'free' | 'growth';

export interface SubscribeToPlanPayload {
  target_plan_tier: SelfServeTargetTier;
}

// § 8.3 — the implementation calls the Stripe Subscriptions API directly
// (payment_behavior: default_incomplete), NOT Stripe Checkout — no redirect URL is ever
// returned. `status` is passed through verbatim from Stripe's own Subscription object.
export interface SubscribeToPlanResult {
  organization_id: string;
  plan_tier: PlanTier;
  status: 'active' | 'incomplete' | 'past_due' | 'canceled';
  current_period_end?: string | null; // absent (not null) on a downgrade-to-free response
}
