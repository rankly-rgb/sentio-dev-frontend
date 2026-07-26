import { supabase } from '@/lib/supabase';
import type { SegmentType } from '@/lib/types/segments';
import type { SegmentAccount } from '@/lib/types/segments';
import type { ChurnRiskBand, ExpansionScoreStatus, ExpansionUnavailableReason, HealthScoreBand, HealthScoreStatus, TrendDirection } from '@/lib/types/accounts';

type AccountRow = {
  id: string;
  stripe_customer_id: string;
  display_name?: string | null;
  hubspot_company_id: string | null;
  plan_tier: string | null;
  billing_interval: string | null;
  mrr_cents: number;
  seat_count: number | null;
  seat_limit: number | null;
  contract_end_date: string | null;
  health_score: number | null;
  health_score_status: HealthScoreStatus;
  health_score_band: HealthScoreBand | null;
  health_score_max_points: number;
  trend_30d: TrendDirection;
  churn_risk_score: number;
  churn_risk_band: ChurnRiskBand;
  risk_signals_evaluated: number;
  expansion_score: number | null;
  expansion_score_status: ExpansionScoreStatus;
  expansion_unavailable_reason: ExpansionUnavailableReason | null;
  primary_segment: SegmentType | null;
  created_at: string;
};

/**
 * Source de vérité : `primary_segment` (docs/API_CONTRACTS.md §4bis), lu tel
 * quel depuis segment_memberships via accounts-api — la sortie persistée du
 * cron de segmentation backend, jamais recalculée côté client.
 *
 * `nouveaux` est le seul cas particulier : non-exclusif par construction
 * (peut coexister avec n'importe quel segment de santé), il n'apparaît donc
 * jamais dans `primary_segment` — on garde le calcul par date ici. Tous les
 * autres segments (y compris `donnees_insuffisantes`) sont une simple
 * égalité sur `primary_segment`. `en_expansion` ne correspond plus à rien
 * (§4bis : n'apparaît jamais dans `primary_segment`), donc ce filtre ne
 * retourne naturellement aucun compte pour ce segment retiré.
 */
export function getSegmentFilter(segment: SegmentType): (a: Pick<AccountRow, 'primary_segment' | 'created_at'>) => boolean {
  if (segment === 'nouveaux') {
    return (a) => {
      if (!a.created_at) return false;
      const diffMs = Date.now() - new Date(a.created_at).getTime();
      return diffMs < 90 * 24 * 60 * 60 * 1000;
    };
  }
  return (a) => a.primary_segment === segment;
}

// ⚠️ UNVERIFIED : docs/API_CONTRACTS.md §4bis décrit primary_segment comme
// "exposé par accounts-api" (calculé dans l'edge function depuis
// segment_memberships), sans confirmer que c'est aussi une colonne/vue
// directement lisible via une requête PostgREST sur la table `accounts` —
// ce que fait ce fichier (bypass de l'edge function, même pattern que le
// reste de ce fichier et qu'exportCsv.ts). Si ce n'est pas le cas, ce
// select échouera à l'exécution et il faudra router ce fetch via
// fetchWithUserJwt('accounts-api...') à la place. À confirmer sur preview.
const ACCOUNT_SELECT =
  'id, stripe_customer_id, display_name, hubspot_company_id, plan_tier, billing_interval, mrr_cents, seat_count, seat_limit, contract_end_date, ' +
  'health_score, health_score_status, health_score_band, health_score_max_points, trend_30d, ' +
  'churn_risk_score, churn_risk_band, risk_signals_evaluated, ' +
  'expansion_score, expansion_score_status, expansion_unavailable_reason, primary_segment, created_at';

export async function getSegmentAccounts(segment: SegmentType, organizationId: string): Promise<SegmentAccount[]> {
  const { data, error } = await supabase
    .from('accounts')
    .select(ACCOUNT_SELECT)
    .eq('organization_id', organizationId)
    .order('mrr_cents', { ascending: false });

  if (error) throw error;

  const filter = getSegmentFilter(segment);
  const rows = (data || []) as unknown as AccountRow[];
  const filtered = rows.filter(filter).map((a) => ({
    id: a.id,
    stripe_customer_id: a.stripe_customer_id,
    display_name: a.display_name ?? null,
    hubspot_company_id: a.hubspot_company_id,
    plan_tier: a.plan_tier,
    billing_interval: a.billing_interval,
    mrr_cents: a.mrr_cents,
    seat_count: a.seat_count,
    seat_limit: a.seat_limit,
    contract_end_date: a.contract_end_date,
    health_score: a.health_score,
    health_score_status: a.health_score_status,
    health_score_band: a.health_score_band,
    health_score_max_points: a.health_score_max_points,
    trend_30d: a.trend_30d,
    churn_risk_score: a.churn_risk_score,
    churn_risk_band: a.churn_risk_band,
    risk_signals_evaluated: a.risk_signals_evaluated,
    expansion_score: a.expansion_score,
    expansion_score_status: a.expansion_score_status,
    expansion_unavailable_reason: a.expansion_unavailable_reason,
    primary_segment: a.primary_segment,
  }));
  if (import.meta.env.DEV) {
    const dupeCount = filtered.length - new Set(filtered.map(a => a.stripe_customer_id)).size;
    if (dupeCount > 0) console.warn(`[sentio] segment(${segment}): ${dupeCount} duplicate stripe_customer_id(s) detected`);
  }
  return Array.from(new Map(filtered.map(a => [a.stripe_customer_id, a])).values());
}
