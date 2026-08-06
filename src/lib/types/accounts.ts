/** Types UI pour les vues comptes clients */

import type { AccountFlag } from '@/types/database';

export type AccountPriorityLabel = 'churned' | 'critical' | 'watch' | 'stable' | 'new';

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
export type ChurnRiskBand = 'low' | 'watch' | 'high' | 'churned';
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
  /**
   * Additif, indépendant de health_score (S5) — mais PAS "jamais null" comme
   * cette note le disait jusqu'au 2026-08-05 : D1/C2.1 (2026-08-02) gèle ce
   * champ à `null` pour un compte `churned` (`churn_risk_band='churned'`,
   * jamais un clamp à 0 — 0 se lirait comme "aucun risque"), et un compte
   * jamais scoré porte aussi `null`. Vérifié sur données réelles : 41 % du
   * portefeuille (`churned` + jamais scoré) porte `churn_risk_band=null`
   * ou `'churned'` au moment de ce correctif — un champ courant, pas un cas
   * limite.
   */
  churn_risk_score: number | null;
  churn_risk_band: ChurnRiskBand | null;
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

/** 'unavailable' = compte non-chiffrable (metered, devise minoritaire...) ou jamais eu de subscription connue — mrr_cents peut être un total partiel, pas un vrai $0 (docs/openspec.md §1/§8, API_CONTRACTS.md accounts-api). */
export type MrrStatus = 'ok' | 'unavailable';

export interface AccountListItem extends ScoringV2Fields {
  id: string;
  stripe_customer_id: string;
  display_name?: string | null;
  plan_tier: string | null;
  billing_interval: string | null;
  mrr_cents: number;
  mrr_status: MrrStatus;
  /** Statut d'abonnement Stripe `past_due`/`unpaid` — indépendant de mrr_status/churn_risk_band (audit délinquence 2026-08-06). */
  is_delinquent: boolean;
  seat_count: number | null;
  seat_limit: number | null;
  contract_end_date: string | null;
  created_at: string;
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
  mrr_status: MrrStatus;
  /** Statut d'abonnement Stripe `past_due`/`unpaid` — indépendant de mrr_status/churn_risk_band (audit délinquence 2026-08-06). */
  is_delinquent: boolean;
  arr_cents: number;
  seat_count: number | null;
  seat_limit: number | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
  score_breakdown: ScoreBreakdown;
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
  /** Devise ISO 4217 de l'org (portfolio-metrics) — null si aucun sync Stripe n'a encore tourné. */
  currency: string | null;
}
