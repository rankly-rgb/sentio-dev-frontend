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
  created_at: string;
};

type SegmentableRow = Pick<
  AccountRow,
  'health_score_status' | 'health_score_band' | 'churn_risk_band' | 'expansion_score_status' | 'expansion_score' | 'mrr_cents' | 'created_at'
>;

/**
 * TODO(chantier 3 — primary_segment) : accounts-api expose désormais (ou
 * exposera) `primary_segment`, calculé par le cron de segmentation backend —
 * c'est la source de vérité. Dès que le champ est confirmé disponible et
 * documenté dans docs/API_CONTRACTS.md, remplacer TOUTE cette fonction
 * (et son usage dans getSegmentAccounts ci-dessous + useSegments.ts) par
 * une simple lecture de `account.primary_segment`. Supprimer en particulier
 * l'heuristique devinée "signal d'expansion actif"
 * (`expansion_score_status === 'available' && expansion_score >= 70`,
 * ligne ci-dessous) qui n'est qu'une approximation non confirmée du critère
 * réel du backend pour `champions`.
 *
 * Jusque-là, ceci reste un filet de sécurité côté client — miroir de la
 * chaîne de priorité documentée dans docs/API_CONTRACTS.md §4 (exclusive,
 * décroissante) : en_churn → impayes → donnees_insuffisantes →
 * en_danger_critique → a_risque_leger → champions → stables (défaut).
 * Pilotée par les bandes/statuts calculés par le backend (health_score_band,
 * churn_risk_band, expansion_score_status) — jamais par des seuils
 * numériques recalculés côté client sur les scores bruts.
 */
export function getSegmentFilter(segment: SegmentType): (a: SegmentableRow) => boolean {
  // TODO(chantier 3 — primary_segment) : heuristique devinée, à supprimer dès
  // que primary_segment est disponible (voir TODO au-dessus de cette fonction).
  const hasActiveExpansionSignal = (a: SegmentableRow) =>
    a.expansion_score_status === 'available' && (a.expansion_score ?? 0) >= 70;

  const filters: Record<SegmentType, (a: SegmentableRow) => boolean> = {
    en_churn: (a) => (a.mrr_cents ?? 0) === 0,
    // Proxy : pas de colonne "impayé" dédiée exposée ici — aligné sur l'ancien
    // proxy (churn critique + santé dégradée) en attendant un champ dédié.
    impayes: (a) => a.churn_risk_band === 'high' && a.health_score_band === 'at_risk' && (a.mrr_cents ?? 0) > 0,
    donnees_insuffisantes: (a) => a.health_score_status === 'insufficient',
    en_danger_critique: (a) => a.churn_risk_band === 'high' && (a.mrr_cents ?? 0) > 0 && a.health_score_status !== 'insufficient',
    a_risque_leger: (a) => a.churn_risk_band === 'watch' && (a.mrr_cents ?? 0) > 0 && a.health_score_status !== 'insufficient',
    champions: (a) => a.health_score_band === 'healthy' && hasActiveExpansionSignal(a),
    // Segment retiré des critères actifs v2 (fusionné dans champions) — ne
    // produit plus de nouveaux matches côté client non plus (§3).
    en_expansion: () => false,
    stables: (a) =>
      (a.mrr_cents ?? 0) > 0 &&
      a.health_score_status !== 'insufficient' &&
      a.churn_risk_band !== 'high' &&
      a.churn_risk_band !== 'watch' &&
      !(a.health_score_band === 'healthy' && hasActiveExpansionSignal(a)),
    nouveaux: (a) => {
      if (!a.created_at) return false;
      const diffMs = Date.now() - new Date(a.created_at).getTime();
      return diffMs < 90 * 24 * 60 * 60 * 1000;
    },
  };

  return filters[segment];
}

const ACCOUNT_SELECT =
  'id, stripe_customer_id, display_name, hubspot_company_id, plan_tier, billing_interval, mrr_cents, seat_count, seat_limit, contract_end_date, ' +
  'health_score, health_score_status, health_score_band, health_score_max_points, trend_30d, ' +
  'churn_risk_score, churn_risk_band, risk_signals_evaluated, ' +
  'expansion_score, expansion_score_status, expansion_unavailable_reason, created_at';

// TODO(chantier 3 — primary_segment) : quand disponible, remplacer ce
// fetch+filtre client par `.eq('primary_segment', segment)` directement en
// base (ou un appel accounts-api filtré), et supprimer getSegmentFilter.
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
  }));
  if (import.meta.env.DEV) {
    const dupeCount = filtered.length - new Set(filtered.map(a => a.stripe_customer_id)).size;
    if (dupeCount > 0) console.warn(`[sentio] segment(${segment}): ${dupeCount} duplicate stripe_customer_id(s) detected`);
  }
  return Array.from(new Map(filtered.map(a => [a.stripe_customer_id, a])).values());
}
