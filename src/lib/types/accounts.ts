/** Types UI pour les vues comptes clients */

import type { AccountFlag } from '@/types/database';

export type SegmentType =
  | 'champions'
  | 'en_expansion'
  | 'stables'
  | 'a_risque_leger'
  | 'en_danger_critique'
  | 'impayes'
  | 'en_churn'
  | 'nouveaux';

export interface SegmentMembership {
  segment_id: string;
  status: 'active' | 'exited' | 'paused';
  risk_score: number | null;
  last_evaluated_at: string;
  account_segments: {
    segment_name: string;
    segment_type: SegmentType;
    priority: 'low' | 'medium' | 'high' | 'critical';
  };
}

export interface AccountListItem {
  id: string;
  stripe_customer_id: string;
  plan_tier: string | null;
  billing_interval: string | null;
  mrr_cents: number;
  seat_count: number | null;
  seat_limit: number | null;
  health_score: number | null;
  churn_risk_score: number | null;
  expansion_score: number | null;
  product_usage_score: number | null;
  contract_end_date: string | null;
  active_subscriptions: number;
  segment_name: string | null;
  flags: AccountFlag[];
}

export interface AccountDetail {
  id: string;
  organization_id: string;
  stripe_customer_id: string;
  hubspot_company_id: string | null;
  plan_tier: string | null;
  billing_interval: string | null;
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
  financial_score: number | null;
  engagement_score: number | null;
  contract_score: number | null;
  scores_calculated_at: string | null;
  last_stripe_sync_at: string | null;
  last_hubspot_sync_at: string | null;
  flags: AccountFlag[];
  created_at: string;
  subscriptions: SubscriptionItem[];
  recent_invoices: InvoiceItem[];
  recent_usage: UsageItem[];
  score_history: ScoreHistoryItem[];
  hubspot_data: HubspotData | null;
  segments: SegmentMembership[];
}

export interface SubscriptionItem {
  id: string;
  stripe_sub_id: string;
  stripe_price_id: string | null;
  status: string;
  mrr_cents: number;
  quantity: number;
  trial_end_date: string | null;
  cancel_at: string | null;
}

export interface InvoiceItem {
  id: string;
  stripe_invoice_id: string;
  amount_cents: number;
  currency: string;
  status: string;
  invoice_date: string;
  due_date: string | null;
  paid_at: string | null;
}

export interface UsageItem {
  event_type: string;
  feature_name: string | null;
  event_count: number;
  event_date: string;
}

export interface ScoreHistoryItem {
  snapshot_date: string;
  health_score: number | null;
  churn_risk_score: number | null;
  expansion_score: number | null;
  product_usage_score: number | null;
  financial_score: number | null;
  engagement_score: number | null;
  contract_score: number | null;
  mrr_cents: number | null;
}

export interface HubspotData {
  lifecycle_stage: string | null;
  nps_score: number | null;
  open_deal_count: number;
  open_ticket_count: number;
  last_meeting_date: string | null;
  last_email_date: string | null;
  last_synced_at: string | null;
}

export interface AccountSummaryCards {
  total_accounts: number;
  at_risk_accounts: number;
  healthy_accounts: number;
  expansion_ready: number;
  total_mrr_cents: number;
  mrr_at_risk_cents: number;
}
