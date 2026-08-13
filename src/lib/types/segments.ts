/** Types et constantes pour les segments clients */
import type { SegmentType, ChurnRiskBand, ExpansionScoreStatus, ExpansionUnavailableReason, HealthScoreBand, HealthScoreStatus, TrendDirection, MrrStatus } from './accounts';

export { type SegmentType };

export const SEGMENT_KEYS: readonly SegmentType[] = [
  'champions',
  'en_expansion',
  'stables',
  'a_risque_leger',
  'en_danger_critique',
  'impayes',
  'en_churn',
  'nouveaux',
  'donnees_insuffisantes',
] as const;

export const SEGMENT_LABELS: Record<SegmentType, string> = {
  champions: 'Champions',
  en_expansion: 'Expanding',
  stables: 'Stable',
  a_risque_leger: 'Slight risk',
  en_danger_critique: 'Critical danger',
  impayes: 'Past due',
  en_churn: 'Churning',
  nouveaux: 'New (< 90d)',
  donnees_insuffisantes: 'Insufficient data',
};

export const SEGMENT_COLORS: Record<SegmentType, { text: string; bg: string; border: string }> = {
  champions: { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  en_expansion: { text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  stables: { text: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' },
  a_risque_leger: { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  en_danger_critique: { text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
  impayes: { text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
  en_churn: { text: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200' },
  nouveaux: { text: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  // Traitement visuel neutre (gris) — F7 : ce n'est pas un segment de santé, c'est une absence de donnée.
  donnees_insuffisantes: { text: 'text-gray-500', bg: 'bg-gray-100', border: 'border-gray-300' },
};

export interface SegmentAccount {
  id: string;
  stripe_customer_id: string;
  display_name?: string | null;
  hubspot_company_id: string | null;
  plan_tier: string | null;
  billing_interval: string | null;
  mrr_cents: number;
  mrr_status: MrrStatus;
  seat_count: number | null;
  seat_limit: number | null;
  contract_end_date: string | null;
  health_score: number | null;
  health_score_status: HealthScoreStatus;
  health_score_band: HealthScoreBand | null;
  health_score_max_points: number;
  trend_30d: TrendDirection;
  churn_risk_score: number | null;
  churn_risk_band: ChurnRiskBand | null;
  risk_signals_evaluated: number;
  expansion_score: number | null;
  expansion_score_status: ExpansionScoreStatus;
  expansion_unavailable_reason: ExpansionUnavailableReason | null;
  primary_segment: SegmentType | null;
}

export function isValidSegmentKey(key: string): key is SegmentType {
  return (SEGMENT_KEYS as readonly string[]).includes(key);
}
