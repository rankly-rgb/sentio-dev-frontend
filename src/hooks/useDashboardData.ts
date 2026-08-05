import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';
import { useAuth } from '@/contexts/AuthContext';
import { getSegmentFilter } from '@/lib/queries/segment-queries';
import { getAllAccountsForOrg } from '@/lib/queries/accounts';
import type { AccountListItem } from '@/lib/types/accounts';
import { getPortfolioMetrics } from '@/lib/queries/portfolio-metrics';
import type { DashboardMetrics, HealthDistribution } from '@/types/dashboard';
import type { ChurnRiskBand, ExpansionScoreStatus, HealthScoreBand, HealthScoreStatus } from '@/lib/types/accounts';

export interface TopAccount {
  id: string;
  stripe_customer_id: string;
  display_name?: string | null;
  mrr_cents: number;
  churn_risk_score: number;
  churn_risk_band: ChurnRiskBand;
  expansion_score: number | null;
  expansion_score_status: ExpansionScoreStatus;
  health_score: number | null;
  health_score_band: HealthScoreBand | null;
  seat_count: number | null;
  seat_limit: number | null;
  plan_tier: string | null;
}

interface DashboardAccountRow {
  mrr_cents: number;
  health_score_status: HealthScoreStatus;
}

interface BriefingResponse {
  data: {
    portfolio: {
      current_avg_health: number | null;
      week_ago_avg_health: number | null;
      health_delta_7d: number | null;
      health_trend: 'up' | 'down' | 'stable' | 'unknown';
    };
    risk_accounts_7d: number;
    p0_insights_count: number;
  };
}

// mrr_cents/arr_cents/nrr_percentage/churn_rate/accounts_at_risk/mrr_at_risk_cents/
// expansion_opportunities/currency viennent tous de portfolio-metrics (Phase 4
// backend, docs/API_CONTRACTS.md) — endpoint autoritaire, plus jamais recalculés
// ici (AUDIT_LOGIQUE_METIER_STRIPE.md point 22 : 3 implémentations locales
// divergentes existaient avant ce chantier). total_accounts/active_accounts/
// avg_health_score restent des comptages simples non concernés par ce point —
// avg_health_score reste server-side (dashboard-api/briefing) comme avant.
async function fetchDashboardMetrics(organizationId: string): Promise<DashboardMetrics> {
  const [briefing, portfolioMetrics, accountsRes] = await Promise.all([
    fetchWithUserJwt<BriefingResponse>('dashboard-api/briefing'),
    getPortfolioMetrics(),
    supabase
      .from('accounts')
      .select('mrr_cents, health_score_status')
      .eq('organization_id', organizationId),
  ]);

  if (accountsRes.error) throw accountsRes.error;

  const all = (accountsRes.data || []) as DashboardAccountRow[];
  const active = all.filter(a => (a.mrr_cents || 0) > 0);
  const scoredAccounts = all.filter(a => a.health_score_status !== 'insufficient').length;

  return {
    mrr_cents: portfolioMetrics.mrr_cents,
    arr_cents: portfolioMetrics.arr_cents,
    nrr_percentage: portfolioMetrics.nrr_percentage,
    total_accounts: all.length,
    active_accounts: active.length,
    accounts_at_risk: portfolioMetrics.accounts_at_risk,
    mrr_at_risk_cents: portfolioMetrics.mrr_at_risk_cents,
    expansion_opportunities: portfolioMetrics.expansion_opportunities,
    avg_health_score: briefing.data.portfolio.current_avg_health,
    avg_health_scored_accounts: scoredAccounts,
    churn_rate: portfolioMetrics.churn_rate,
    currency: portfolioMetrics.currency,
    stripe_stale: portfolioMetrics.stripe_stale,
    billing_profile: portfolioMetrics.billing_profile,
    mrr_unavailable_accounts: portfolioMetrics.mrr_unavailable_accounts,
  };
}

// Chargé via accounts-api (getAllAccountsForOrg), pas un .select() brut sur
// `accounts` — voir le commentaire dans segment-queries.ts sur primary_segment.
async function fetchHealthDistribution(): Promise<HealthDistribution> {
  const all = await getAllAccountsForOrg();

  return {
    champions: all.filter(getSegmentFilter('champions')).length,
    expanding: all.filter(getSegmentFilter('en_expansion')).length,
    stable: all.filter(getSegmentFilter('stables')).length,
    at_risk_light: all.filter(getSegmentFilter('a_risque_leger')).length,
    critical: all.filter(getSegmentFilter('en_danger_critique')).length,
    unpaid: all.filter(getSegmentFilter('impayes')).length,
    churned: all.filter(getSegmentFilter('en_churn')).length,
    new_accounts: all.filter(getSegmentFilter('nouveaux')).length,
    insufficient_data: all.filter(getSegmentFilter('donnees_insuffisantes')).length,
  };
}

export interface TopAccountsResult {
  atRisk: TopAccount[];
  atRiskTotalCount: number;
  atRiskTotalMrrCents: number;
  expansion: TopAccount[];
  expansionTotalCount: number;
  expansionTotalMrrCents: number;
}

// Lit `primary_segment` via getAllAccountsForOrg (accounts-api) plutôt que de
// réimplémenter le critère "à risque" en JS (churn_risk_band==='high' &&
// mrr_cents>0) — AUDIT_LOGIQUE_METIER_STRIPE.md point 22 : `en_danger_critique`
// EST déjà exactement ce critère côté backend (segmentation V3, en_churn
// prioritaire dessus exclut déjà tout compte à mrr_cents=0/canceled), même
// bonne pratique que segment-queries.ts. Pas de segment dédié "expansion"
// (en_expansion n'est plus jamais assigné, fusionné dans champions) — filtre
// par champs conservé pour cette liste, mais sourcé depuis le même appel.
async function fetchTopAccounts(): Promise<TopAccountsResult> {
  const all = await getAllAccountsForOrg();

  // primary_segment==='en_danger_critique' implies churn_risk_band==='high'
  // server-side (segmentation V3), which is never assigned without a real
  // churn_risk_score — but that's a backend invariant, not something the
  // type system can see through a string filter. Narrow explicitly instead
  // of assuming (docs/RUNBOOK.md, 2026-08-05 incident: an assumed-non-null
  // churn field is exactly what crashed AccountDetail on 41% of accounts).
  const allAtRisk = all
    .filter((a): a is AccountListItem & { churn_risk_score: number; churn_risk_band: ChurnRiskBand } =>
      a.primary_segment === 'en_danger_critique' && a.churn_risk_score !== null && a.churn_risk_band !== null)
    .sort((a, b) => b.churn_risk_score - a.churn_risk_score);

  const allExpansion = all
    .filter((a): a is AccountListItem & { churn_risk_score: number; churn_risk_band: ChurnRiskBand } =>
      a.expansion_score_status === 'available' && (a.expansion_score ?? 0) >= 70 && (a.health_score ?? 0) >= 60
      && a.churn_risk_score !== null && a.churn_risk_band !== null)
    .sort((a, b) => (b.expansion_score ?? 0) - (a.expansion_score ?? 0));

  return {
    atRisk: allAtRisk.slice(0, 5),
    atRiskTotalCount: allAtRisk.length,
    atRiskTotalMrrCents: allAtRisk.reduce((s, a) => s + (a.mrr_cents || 0), 0),
    expansion: allExpansion.slice(0, 5),
    expansionTotalCount: allExpansion.length,
    expansionTotalMrrCents: allExpansion.reduce((s, a) => s + (a.mrr_cents || 0), 0),
  };
}

export function useDashboardData() {
  const { user } = useAuth();
  const orgId = user?.organization_id;

  const metricsQuery = useQuery({
    queryKey: ['dashboard', 'metrics', orgId],
    queryFn: () => fetchDashboardMetrics(orgId!),
    enabled: !!orgId,
    staleTime: 120_000,
  });

  const distributionQuery = useQuery({
    queryKey: ['dashboard', 'distribution', orgId],
    queryFn: fetchHealthDistribution,
    enabled: !!orgId,
    staleTime: 120_000,
  });

  const topAccountsQuery = useQuery({
    queryKey: ['dashboard', 'topAccounts', orgId],
    queryFn: fetchTopAccounts,
    enabled: !!orgId,
    staleTime: 120_000,
  });

  return {
    metrics: metricsQuery.data || null,
    distribution: distributionQuery.data || null,
    topAccounts: topAccountsQuery.data || null,
    isLoading: metricsQuery.isLoading || distributionQuery.isLoading,
    error: metricsQuery.error || distributionQuery.error,
    refetch: () => {
      metricsQuery.refetch();
      distributionQuery.refetch();
      topAccountsQuery.refetch();
    },
  };
}
