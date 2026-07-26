/** Types UI pour les vues comptes clients */

import type { AccountFlag } from '@/types/database';

export type AccountPriorityLabel = 'critique' | 'surveillance' | 'stable' | 'nouveau';

export type SegmentType =
  | 'champions'
  | 'en_expansion'
  | 'stables'
  | 'a_risque_leger'
  | 'en_danger_critique'
  | 'impayes'
  | 'en_churn'
  | 'nouveaux'
  | 'donnees_insuffisantes';

// ── Scoring Engine V2 (model_version='v3') — docs/API_CONTRACTS.md §2 ──

export type HealthScoreStatus = 'complete' | 'partial' | 'insufficient';
export type HealthScoreBand = 'healthy' | 'watch' | 'at_risk';
export type ChurnRiskBand = 'low' | 'watch' | 'high';
export type ExpansionScoreStatus = 'available' | 'unavailable';
export type ExpansionUnavailableReason = 'seat_data_not_configured' | 'unlimited_plan_no_ceiling';
export type TrendDirection = 'up' | 'flat' | 'down';
export type RiskSignalSeverity = 'CRITIQUE' | 'MAJEUR' | 'MINEUR';
export type ScoreDimensionStatus = 'available' | 'unavailable';
export type ScoreDimensionKey = 'payment_health' | 'revenue_dynamics' | 'contract_renewal';

export interface RiskSignal {
  code: string;
  label: string;
  severity: RiskSignalSeverity;
  points: number;
}

export interface ScoreBreakdownSignal {
  code: string;
  label: string;
  /** Poids interne à la dimension (fraction de 1.0), pas le poids org sur 100. */
  weight: number;
  value: number | null;
  status: ScoreDimensionStatus;
}

export interface ScoreBreakdownDimension {
  score: number | null;
  status: ScoreDimensionStatus;
  /** Poids org sur 100 (voir organizations.scoring_weights). */
  weight: number;
  signals: ScoreBreakdownSignal[];
}

export type ScoreBreakdown = Record<ScoreDimensionKey, ScoreBreakdownDimension>;

export interface ScoringV2Fields {
  payment_health_score: number | null;
  revenue_dynamics_score: number | null;
  contract_renewal_score: number | null;
  health_score: number | null;
  health_score_status: HealthScoreStatus;
  health_score_max_points: number;
  health_score_band: HealthScoreBand | null;
  /** Additif, indépendant de health_score — jamais null (S5). */
  churn_risk_score: number;
  churn_risk_band: ChurnRiskBand;
  risk_signals_triggered: RiskSignal[];
  risk_signals_evaluated: number;
  expansion_score: number | null;
  expansion_score_status: ExpansionScoreStatus;
  expansion_unavailable_reason: ExpansionUnavailableReason | null;
  trend_30d: TrendDirection;
  /**
   * Lu tel quel depuis segment_memberships (docs/API_CONTRACTS.md §4bis) —
   * jamais recalculé côté frontend. `null` = compte pas encore segmenté par
   * le cron, pas un défaut fabriqué. `en_expansion`/`nouveaux` n'apparaissent
   * jamais ici (voir §4bis).
   */
  primary_segment: SegmentType | null;
}

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

export interface AccountListItem extends ScoringV2Fields {
  id: string;
  stripe_customer_id: string;
  display_name?: string | null;
  plan_tier: string | null;
  billing_interval: string | null;
  mrr_cents: number;
  seat_count: number | null;
  seat_limit: number | null;
  contract_end_date: string | null;
  active_subscriptions: number;
  segment_name: string | null;
  priority_label: AccountPriorityLabel | null;
  flags: AccountFlag[];
}

export interface AccountDetail extends ScoringV2Fields {
  id: string;
  organization_id: string;
  stripe_customer_id: string;
  display_name?: string | null;
  hubspot_company_id: string | null;
  plan_tier: string | null;
  billing_interval: string | null;
  mrr_cents: number;
  arr_cents: number;
  seat_count: number | null;
  seat_limit: number | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
  score_breakdown: ScoreBreakdown;
  /** Dimensions retirées du modèle v2 — gelées, lecture seule, ne plus recalculer (§3). */
  usage_frozen_v2: number | null;
  engagement_frozen_v2: number | null;
  scores_calculated_at: string | null;
  health_score_is_new?: boolean;
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
  /** Nullable ici uniquement pour les lignes historiques pré-v2 (model_version='v2-explicit-no-data'). */
  churn_risk_score: number | null;
  expansion_score: number | null;
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
