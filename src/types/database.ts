/** Types correspondant au schéma DB Sentio AI SaaS FR */

export interface Organization {
  id: string;
  name: string;
  stripe_account_id: string | null;
  hubspot_portal_id: string | null;
  plan_type: string | null;
  is_active: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  auth_user_id: string;
  organization_id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'member' | 'viewer';
  avatar_url: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Compte client SaaS B2B */
export interface Account {
  id: string;
  organization_id: string;
  stripe_customer_id: string;
  hubspot_company_id: string | null;
  mrr_cents: number;
  arr_cents: number;
  seat_count: number | null;
  seat_limit: number | null;
  contract_end_date: string | null;
  health_score: number | null;
  churn_risk_score: number | null;
  expansion_score: number | null;
  product_usage_score: number | null;
  scores_calculated_at: string | null;
  last_stripe_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'paused';

export interface Subscription {
  id: string;
  organization_id: string;
  account_id: string;
  stripe_sub_id: string;
  stripe_price_id: string | null;
  stripe_product_id: string | null;
  status: SubscriptionStatus;
  mrr_cents: number;
  quantity: number;
  trial_end_date: string | null;
  cancel_at: string | null;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
}

export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';

export interface Invoice {
  id: string;
  organization_id: string;
  account_id: string;
  subscription_id: string | null;
  stripe_invoice_id: string;
  amount_cents: number;
  currency: string;
  status: InvoiceStatus;
  invoice_date: string;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export type MrrMovementType = 'new' | 'expansion' | 'contraction' | 'churn' | 'reactivation';

export interface MrrMovement {
  id: string;
  organization_id: string;
  account_id: string;
  movement_type: MrrMovementType;
  amount_cents: number;
  movement_date: string;
  stripe_event_id: string | null;
  created_at: string;
}

export interface UsageEvent {
  id: string;
  organization_id: string;
  account_id: string;
  event_type: string;
  feature_name: string | null;
  event_count: number;
  event_date: string;
  source: string;
  created_at: string;
}

export interface HubspotCompany {
  id: string;
  organization_id: string;
  account_id: string;
  hubspot_company_id: string;
  nps_score: number | null;
  open_ticket_count: number;
  open_deal_count: number;
  last_meeting_date: string | null;
  last_hubspot_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScoreHistory {
  id: string;
  organization_id: string;
  account_id: string;
  snapshot_date: string;
  health_score: number | null;
  churn_risk_score: number | null;
  expansion_score: number | null;
  product_usage_score: number | null;
  mrr_cents: number | null;
  created_at: string;
}

export interface CustomerSegment {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  criteria: Record<string, unknown>;
  is_system: boolean;
  is_active: boolean;
  accounts_count: number;
  created_at: string;
  updated_at: string;
}

export type SyncSource = 'stripe' | 'hubspot' | 'usage' | 'manual';
export type SyncStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'rate_limited';

export interface DataSync {
  id: string;
  organization_id: string;
  sync_source: SyncSource;
  sync_type: string | null;
  sync_status: SyncStatus;
  triggered_by: string | null;
  webhook_event_id: string | null;
  is_manual: boolean | null;
  started_at: string | null;
  completed_at: string | null;
  duration_seconds: number | null;
  records_processed: number | null;
  records_created: number | null;
  records_updated: number | null;
  records_failed: number | null;
  accounts_processed: number | null;
  subscriptions_processed: number | null;
  invoices_processed: number | null;
  movements_processed: number | null;
  usage_events_processed: number | null;
  companies_processed: number | null;
  api_calls_made: number | null;
  error_message: string | null;
  error_type: string | null;
  is_retryable: boolean | null;
  sync_summary: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export type InsightType = 'churn_risk' | 'expansion' | 'reactivation' | 'health_drop' | 'milestone';
export type InsightSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AiInsight {
  id: string;
  organization_id: string;
  account_id: string;
  insight_type: InsightType;
  title: string;
  content: string;
  severity: InsightSeverity;
  is_read: boolean;
  is_dismissed: boolean;
  generated_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Playbook {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  trigger_type: 'score_drop' | 'churn_risk' | 'renewal' | 'expansion';
  trigger_conditions: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlaybookExecution {
  id: string;
  organization_id: string;
  playbook_id: string;
  account_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  triggered_by: string | null;
  started_at: string | null;
  completed_at: string | null;
  result: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}
