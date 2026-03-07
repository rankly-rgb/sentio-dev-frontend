/** Types et constantes pour les segments clients */
import type { SegmentType } from './accounts';

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
] as const;

export const SEGMENT_LABELS: Record<SegmentType, string> = {
  champions: 'Champions',
  en_expansion: 'En expansion',
  stables: 'Stables',
  a_risque_leger: 'À risque léger',
  en_danger_critique: 'En danger critique',
  impayes: 'Impayés',
  en_churn: 'En churn',
  nouveaux: 'Nouveaux (< 90j)',
};

export const SEGMENT_COLORS: Record<SegmentType, { text: string; bg: string }> = {
  champions: { text: 'text-green-700', bg: 'bg-green-100' },
  en_expansion: { text: 'text-blue-700', bg: 'bg-blue-100' },
  stables: { text: 'text-gray-700', bg: 'bg-gray-100' },
  a_risque_leger: { text: 'text-yellow-700', bg: 'bg-yellow-100' },
  en_danger_critique: { text: 'text-red-700', bg: 'bg-red-100' },
  impayes: { text: 'text-orange-700', bg: 'bg-orange-100' },
  en_churn: { text: 'text-red-900', bg: 'bg-red-200' },
  nouveaux: { text: 'text-purple-700', bg: 'bg-purple-100' },
};

export interface SegmentAccount {
  id: string;
  stripe_customer_id: string;
  hubspot_company_id: string | null;
  plan_tier: string | null;
  billing_interval: string | null;
  mrr_cents: number;
  seat_count: number | null;
  seat_limit: number | null;
  contract_end_date: string | null;
  health_score: number | null;
  churn_risk_score: number | null;
  expansion_score: number | null;
  product_usage_score: number | null;
}

export function isValidSegmentKey(key: string): key is SegmentType {
  return (SEGMENT_KEYS as readonly string[]).includes(key);
}
