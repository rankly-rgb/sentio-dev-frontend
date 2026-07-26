import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';
import { useAuth } from '@/contexts/AuthContext';
import { getSegmentFilter } from '@/lib/queries/segment-queries';
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
  id: string;
  mrr_cents: number;
  health_score: number | null;
  health_score_status: HealthScoreStatus;
  churn_risk_score: number;
  churn_risk_band: ChurnRiskBand;
  expansion_score: number | null;
  expansion_score_status: ExpansionScoreStatus;
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

async function fetchDashboardMetrics(organizationId: string): Promise<DashboardMetrics> {
  // Le dénominateur "avg health" doit être server-side (dashboard-api/briefing) —
  // jamais recalculé côté client à partir de ?? 0 (docs/API_CONTRACTS.md S1).
  const [briefing, accountsRes] = await Promise.all([
    fetchWithUserJwt<BriefingResponse>('dashboard-api/briefing'),
    supabase
      .from('accounts')
      .select('id, mrr_cents, health_score, health_score_status, churn_risk_score, churn_risk_band, expansion_score, expansion_score_status')
      .eq('organization_id', organizationId),
  ]);

  if (accountsRes.error) throw accountsRes.error;

  const all = (accountsRes.data || []) as DashboardAccountRow[];
  const active = all.filter(a => (a.mrr_cents || 0) > 0);
  const atRisk = all.filter(a => a.churn_risk_band === 'high');
  const totalMrr = all.reduce((s, a) => s + (a.mrr_cents || 0), 0);
  const scoredAccounts = all.filter(a => a.health_score_status !== 'insufficient').length;

  return {
    mrr_cents: totalMrr,
    arr_cents: totalMrr * 12,
    nrr_percentage: 100,
    logo_retention_rate: all.length > 0 ? (active.length / all.length) * 100 : 0,
    total_accounts: all.length,
    active_accounts: active.length,
    accounts_at_risk: atRisk.length,
    mrr_at_risk_cents: atRisk.reduce((s, a) => s + (a.mrr_cents || 0), 0),
    expansion_opportunities: all.filter(a => a.expansion_score_status === 'available' && (a.expansion_score ?? 0) > 75).length,
    avg_health_score: briefing.data.portfolio.current_avg_health,
    avg_health_scored_accounts: scoredAccounts,
    churn_rate: all.length > 0 ? (atRisk.length / all.length) * 100 : 0,
  };
}

async function fetchHealthDistribution(organizationId: string): Promise<HealthDistribution> {
  const { data: accounts, error } = await supabase
    .from('accounts')
    .select('health_score_status, health_score_band, churn_risk_band, expansion_score, expansion_score_status, mrr_cents, created_at')
    .eq('organization_id', organizationId);

  if (error) throw error;

  const all = accounts || [];

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
  expansion: TopAccount[];
  expansionTotalCount: number;
  expansionTotalMrrCents: number;
}

async function fetchTopAccounts(organizationId: string): Promise<TopAccountsResult> {
  const { data: accounts, error } = await supabase
    .from('accounts')
    .select('id, stripe_customer_id, display_name, mrr_cents, churn_risk_score, churn_risk_band, expansion_score, expansion_score_status, health_score, health_score_band, seat_count, seat_limit, plan_tier')
    .eq('organization_id', organizationId);

  if (error) throw error;

  const all = (accounts || []) as TopAccount[];

  const atRisk = all
    .filter(a => a.churn_risk_band === 'high' && (a.mrr_cents || 0) > 0)
    .sort((a, b) => b.churn_risk_score - a.churn_risk_score)
    .slice(0, 5);

  const allExpansion = all
    .filter(a => a.expansion_score_status === 'available' && (a.expansion_score ?? 0) >= 70 && (a.health_score ?? 0) >= 60)
    .sort((a, b) => (b.expansion_score ?? 0) - (a.expansion_score ?? 0));

  return {
    atRisk,
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
    queryFn: () => fetchHealthDistribution(orgId!),
    enabled: !!orgId,
    staleTime: 120_000,
  });

  const topAccountsQuery = useQuery({
    queryKey: ['dashboard', 'topAccounts', orgId],
    queryFn: () => fetchTopAccounts(orgId!),
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
