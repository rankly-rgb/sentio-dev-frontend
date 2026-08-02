export interface OnboardingFlowStatus {
  stripe_connected: boolean;
  stripe_sync_completed: boolean;
  stripe_sync_in_progress: boolean;
  hubspot_connected: boolean;
  first_win_seen: boolean;
  onboarding_completed: boolean;
  current_step: string;
  accounts_count: number;
  at_risk_count: number;
}

export interface OnboardingFirstWinAccount {
  stripe_customer_id: string;
  display_name: string | null;
  health_score: number;
  churn_risk: number;
  mrr: number;
  top_risk_reason: string;
}

export interface IntegrationsConfigStatus {
  stripe_configured: boolean;
  hubspot_configured: boolean;
  stripe_account_id: string | null;
  stripe_connection_method: 'api_key' | 'oauth' | null;
}

export interface OnboardingFirstWin {
  total_accounts: number;
  at_risk_accounts: OnboardingFirstWinAccount[];
  mrr_at_risk: number;
  global_health_score: number;
}
