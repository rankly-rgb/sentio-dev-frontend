/** Types correspondant au schéma DB Sentio AI SaaS FR */

export interface Organization {
  id: string;
  name: string;
  stripe_account_id: string | null;
  hubspot_api_key: string | null;
  plan_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  auth_user_id: string;
  organization_id: string;
  email: string;
  full_name: string | null;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
  updated_at: string;
}

/** Compte client SaaS B2B (remplace Customer) */
export interface Account {
  id: string;
  organization_id: string;
  stripe_customer_id: string;
  hubspot_company_id: string | null;
  plan_tier: 'starter' | 'growth' | 'enterprise' | null;
  billing_interval: 'monthly' | 'annual' | null;
  mrr_cents: number;
  arr_cents: number;
  seat_count: number | null;
  seat_limit: number | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
  health_score: number | null;
  churn_risk_score: number | null;
  expansion_score: number | null;
  product_usage_score: number | null;
  last_stripe_sync_at: string | null;
  last_hubspot_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing' | 'paused';

export interface Subscription {
  id: string;
  organization_id: string;
  account_id: string;
  stripe_sub_id: string;
  stripe_price_id: string | null;
  status: SubscriptionStatus;
  mrr_cents: number;
  quantity: number;
  trial_end_date: string | null;
  cancel_at: string | null;
  created_at: string;
  updated_at: string;
}

export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';

export interface Invoice {
  id: string;
  organization_id: string;
  account_id: string;
  stripe_invoice_id: string;
  amount_cents: number;
  currency: string;
  status: InvoiceStatus;
  invoice_date: string;
  paid_at: string | null;
  due_date: string | null;
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
  updated_at: string;
}

export type UsageSource = 'api' | 'webhook' | 'manual';

export interface UsageEvent {
  id: string;
  organization_id: string;
  account_id: string;
  event_type: string;
  feature_name: string | null;
  event_count: number;
  event_date: string;
  source: UsageSource;
  created_at: string;
  updated_at: string;
}

export interface HubspotCompany {
  id: string;
  organization_id: string;
  account_id: string;
  hubspot_company_id: string;
  lifecycle_stage: string | null;
  nps_score: number | null;
  open_deal_count: number;
  open_ticket_count: number;
  last_meeting_date: string | null;
  last_email_date: string | null;
  last_synced_at: string | null;
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
  updated_at: string;
}

export type SyncSource = 'stripe' | 'hubspot' | 'usage' | 'manual';
export type SyncStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface DataSync {
  id: string;
  organization_id: string;
  sync_source: SyncSource;
  sync_status: SyncStatus;
  records_processed: number | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type InsightType =
  | 'churn_prediction'
  | 'expansion_opportunity'
  | 'renewal_alert'
  | 'usage_decline'
  | 'payment_risk';

export type InsightSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AiInsight {
  id: string;
  organization_id: string;
  account_id: string;
  insight_type: InsightType;
  title: string;
  description: string;
  severity: InsightSeverity;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface Playbook {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlaybookExecution {
  id: string;
  organization_id: string;
  playbook_id: string;
  account_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebhookConfig {
  id: string;
  organization_id: string;
  provider: string;
  hmac_secret: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
