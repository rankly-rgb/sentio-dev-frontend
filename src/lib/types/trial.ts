// Matches organizations.plan_type CHECK constraint (backend
// 20260802000006_subscription_tier_check.sql) and
// _shared/subscription-tiers.ts::SubscriptionTierKey exactly. Was
// 'starter' instead of 'scale' before — a contract mismatch nobody could
// hit until the /trial-status endpoint existed to actually return a value.
export type PlanType = 'free' | 'growth' | 'scale' | 'enterprise';

export interface TrialStatus {
  plan_type: PlanType;
  trial_ends_at: string | null;
  trial_days_remaining: number;
  is_trial_active: boolean;
  is_trial_expired: boolean;
}
