export type WizardStepId = 'stripe' | 'import' | 'first_win' | 'hubspot';
export type WizardStepStatus = 'completed' | 'active' | 'pending';
export type CurrentStep = 'stripe' | 'hubspot' | 'first_win' | 'done';

export interface WizardStep {
  id: WizardStepId;
  label_fr: string;
  label_en: string;
  required: boolean;
  status: WizardStepStatus;
}

export interface TopRiskAccount {
  id: string;
  stripe_customer_id: string;
  display_name: string;
  churn_risk_score: number;
  health_score: number;
}

export interface OnboardingStatusData {
  stripe_connected: boolean;
  stripe_sync_in_progress: boolean;
  hubspot_connected: boolean;
  first_score_calculated: boolean;
  aha_moment_ready: boolean;
  aha_moment_seen: boolean;
  onboarding_completed: boolean;
  current_step: CurrentStep;
  wizard_steps: WizardStep[];
  accounts_count: number;
  at_risk_count: number;
  top_risk_account: TopRiskAccount | null;
}

export interface OnboardingStatusResponse {
  data: OnboardingStatusData;
}
