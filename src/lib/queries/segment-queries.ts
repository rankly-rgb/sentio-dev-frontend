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
    // health >= 80 AND churn_risk < 50
    champions: (a) => (a.health_score ?? 0) >= 80 && (a.churn_risk_score ?? 100) < 50,
    // expansion >= 70 AND health 60-79 AND churn_risk < 50
    en_expansion: (a) =>
      (a.expansion_score ?? 0) >= 70 &&
      (a.health_score ?? 0) >= 60 &&
      (a.health_score ?? 0) < 80 &&
      (a.churn_risk_score ?? 100) < 50,
    // mrr > 0 AND churn_risk < 50 AND health < 80 AND NOT(expansion >= 70 AND health >= 60)
    stables: (a) => {
      const health = a.health_score ?? 0;
      const churn = a.churn_risk_score ?? 100;
      const expansion = a.expansion_score ?? 0;
      return a.mrr_cents > 0 && churn < 50 && health < 80 &&
        !(expansion >= 70 && health >= 60);
    },
    // churn_risk 50-69 AND mrr > 0
    a_risque_leger: (a) => {
      const churn = a.churn_risk_score ?? 0;
      return churn >= 50 && churn < 70 && a.mrr_cents > 0;
    },
    // churn_risk >= 70 AND mrr > 0
    en_danger_critique: (a) => (a.churn_risk_score ?? 0) >= 70 && a.mrr_cents > 0,
    // churn_risk > 80 AND health < 50 AND mrr > 0 (proxy score)
    impayes: (a) => (a.churn_risk_score ?? 0) > 80 && (a.health_score ?? 0) < 50 && a.mrr_cents > 0,
    // mrr = 0
    en_churn: (a) => a.mrr_cents === 0,
    // created < 90 jours (non-exclusif)
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
