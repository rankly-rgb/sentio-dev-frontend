import { getAllAccountsForOrg } from '@/lib/queries/accounts';
import type { SegmentType } from '@/lib/types/segments';
import type { SegmentAccount } from '@/lib/types/segments';
import type { AccountListItem } from '@/lib/types/accounts';

/**
 * Source de vérité : `primary_segment` (docs/SCORING_ENGINE_CONTRACT.md §4bis), lu tel
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
export function getSegmentFilter(segment: SegmentType): (a: Pick<AccountListItem, 'primary_segment' | 'created_at'>) => boolean {
  if (segment === 'nouveaux') {
    return (a) => {
      if (!a.created_at) return false;
      const diffMs = Date.now() - new Date(a.created_at).getTime();
      return diffMs < 90 * 24 * 60 * 60 * 1000;
    };
  }
  return (a) => a.primary_segment === segment;
}

/**
 * Chargé via accounts-api (getAllAccountsForOrg) plutôt qu'un .select() brut
 * sur la table `accounts` : primary_segment n'est confirmé disponible que via
 * cette edge function (docs/SCORING_ENGINE_CONTRACT.md §4bis + fixtures backend), la
 * question de savoir si c'est aussi une colonne PostgREST directe reste
 * ouverte côté backend — on ne parie pas dessus.
 *
 * `hubspot_company_id` n'existe pas sur le payload accounts-api liste ;
 * mis à `null` ici (non affiché dans l'UI actuelle — colonnes HubSpot
 * commentées "V2 - HubSpot" dans SegmentDetailView).
 */
export async function getSegmentAccounts(segment: SegmentType, _organizationId: string): Promise<SegmentAccount[]> {
  const all = await getAllAccountsForOrg();
  const filter = getSegmentFilter(segment);
  const filtered = all.filter(filter).map((a) => ({
    id: a.id,
    stripe_customer_id: a.stripe_customer_id,
    display_name: a.display_name ?? null,
    hubspot_company_id: null,
    plan_tier: a.plan_tier,
    billing_interval: a.billing_interval,
    mrr_cents: a.mrr_cents,
    mrr_status: a.mrr_status,
    mrr_unavailable_reason: a.mrr_unavailable_reason,
    billing_model: a.billing_model,
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
  return filtered.sort((a, b) => b.mrr_cents - a.mrr_cents);
}
