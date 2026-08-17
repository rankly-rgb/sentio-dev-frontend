export type OnboardingStep =
  | 'promise'
  | 'stripe'
  | 'revelation'
  | 'invested'
  | 'hubspot'
  | 'completed';

export interface OnboardingStatusV2 {
  organization_id: string;
  onboarding_step: OnboardingStep;
  onboarding_completed: boolean;
  promise_seen: boolean;
  first_revelation_done: boolean;
}

export interface AccountsSummaryCount {
  total_accounts: number;
  is_demo: boolean;
}

export interface TopDangerAccount {
  account_id: string;
  company_name: string;
  health_score: number;
  mrr_cents: number;
  segment: string;
  is_demo: boolean;
}

export interface AccountsSummaryRisk {
  at_risk_count: number;
  danger_count: number;
  past_due_count: number;
  top_danger_accounts: TopDangerAccount[];
}

export interface OrgPreferences {
  danger_threshold?: number;
  at_risk_threshold?: number;
  champion_threshold?: number;
  segment_name_champions?: string;
  segment_name_at_risk?: string;
  segment_name_danger?: string;
  segment_name_stable?: string;
  alert_channel?: 'none' | 'slack' | 'email' | 'both';
}

export interface SaveOrgPreferencesResponse {
  saved: boolean;
  onboarding_step: string;
}

export interface CreateOrganizationResponse {
  organization_id: string;
  onboarding_step: string;
}

export interface UpdateOnboardingStepResponse {
  onboarding_step: OnboardingStep;
  onboarding_completed: boolean;
}
