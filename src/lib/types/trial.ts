export type PlanType = 'free' | 'starter' | 'growth' | 'enterprise';

export interface TrialStatus {
  plan_type: PlanType;
  trial_ends_at: string | null;
  trial_days_remaining: number;
  is_trial_active: boolean;
  is_trial_expired: boolean;
}
