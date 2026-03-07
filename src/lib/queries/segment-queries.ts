import { supabase } from '@/lib/supabase';
import type { SegmentType } from '@/lib/types/segments';
import type { SegmentAccount } from '@/lib/types/segments';

type AccountRow = {
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
  created_at: string;
};

function getSegmentFilter(segment: SegmentType): (a: AccountRow) => boolean {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const filters: Record<SegmentType, (a: AccountRow) => boolean> = {
    champions: (a) => (a.health_score ?? 0) > 80 && (a.expansion_score ?? 0) > 70,
    en_expansion: (a) => (a.expansion_score ?? 0) > 75,
    stables: (a) => (a.health_score ?? 0) >= 60 && (a.health_score ?? 0) <= 80 && (a.churn_risk_score ?? 0) < 30,
    a_risque_leger: (a) =>
      ((a.health_score ?? 0) >= 40 && (a.health_score ?? 0) < 60) ||
      ((a.churn_risk_score ?? 0) >= 30 && (a.churn_risk_score ?? 0) <= 50),
    en_danger_critique: (a) => (a.health_score ?? 0) < 40 || (a.churn_risk_score ?? 0) > 70,
    impayes: (a) => (a.churn_risk_score ?? 0) > 80 && (a.health_score ?? 0) < 50,
    en_churn: (a) => (a.churn_risk_score ?? 0) > 90,
    nouveaux: (a) => new Date(a.created_at) > ninetyDaysAgo,
  };

  return filters[segment];
}

export async function getSegmentAccounts(segment: SegmentType): Promise<SegmentAccount[]> {
  const { data, error } = await supabase
    .from('accounts')
    .select(
      'id, stripe_customer_id, hubspot_company_id, plan_tier, billing_interval, mrr_cents, seat_count, seat_limit, contract_end_date, health_score, churn_risk_score, expansion_score, product_usage_score, created_at',
    )
    .order('mrr_cents', { ascending: false })
    .limit(200);

  if (error) throw error;

  const filter = getSegmentFilter(segment);
  const rows = (data || []) as AccountRow[];
  return rows.filter(filter).map((a) => ({
    id: a.id,
    stripe_customer_id: a.stripe_customer_id,
    hubspot_company_id: a.hubspot_company_id,
    plan_tier: a.plan_tier,
    billing_interval: a.billing_interval,
    mrr_cents: a.mrr_cents,
    seat_count: a.seat_count,
    seat_limit: a.seat_limit,
    contract_end_date: a.contract_end_date,
    health_score: a.health_score,
    churn_risk_score: a.churn_risk_score,
    expansion_score: a.expansion_score,
    product_usage_score: a.product_usage_score,
  }));
}
