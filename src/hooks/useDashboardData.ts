import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getSegmentFilter } from '@/lib/queries/segment-queries';
import type { DashboardMetrics, HealthDistribution } from '@/types/dashboard';

export interface TopAccount {
  id: string;
  stripe_customer_id: string;
  mrr_cents: number;
  churn_risk_score: number | null;
  expansion_score: number | null;
  health_score: number | null;
}

async function fetchDashboardMetrics(organizationId: string): Promise<DashboardMetrics> {
  const { data: accounts, error } = await supabase
    .from('accounts')
    .select('id, mrr_cents, health_score, churn_risk_score, expansion_score')
    .eq('organization_id', organizationId);

  if (error) throw error;

  const all = accounts || [];
  const active = all.filter(a => (a.mrr_cents || 0) > 0);
  const atRisk = all.filter(a => (a.churn_risk_score ?? 0) > 70);
  const totalMrr = all.reduce((s, a) => s + (a.mrr_cents || 0), 0);
  const healthScores = all
    .filter((a): a is typeof a & { health_score: number } => a.health_score !== null)
    .map(a => a.health_score);

  return {
    mrr_cents: totalMrr,
    arr_cents: totalMrr * 12,
    nrr_percentage: 100,
    logo_retention_rate: all.length > 0 ? (active.length / all.length) * 100 : 0,
    total_accounts: all.length,
    active_accounts: active.length,
    accounts_at_risk: atRisk.length,
    mrr_at_risk_cents: atRisk.reduce((s, a) => s + (a.mrr_cents || 0), 0),
    expansion_opportunities: all.filter(a => (a.expansion_score ?? 0) > 75).length,
    avg_health_score: healthScores.length > 0
      ? Math.round(healthScores.reduce((s, h) => s + h, 0) / healthScores.length)
      : 0,
    churn_rate: all.length > 0 ? (atRisk.length / all.length) * 100 : 0,
  };
}

async function fetchHealthDistribution(organizationId: string): Promise<HealthDistribution> {
  const { data: accounts, error } = await supabase
    .from('accounts')
    .select('health_score, churn_risk_score, expansion_score, mrr_cents, created_at')
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
  };
}

async function fetchTopAccounts(organizationId: string): Promise<{ atRisk: TopAccount[]; expansion: TopAccount[] }> {
  const { data: accounts, error } = await supabase
    .from('accounts')
    .select('id, stripe_customer_id, mrr_cents, churn_risk_score, expansion_score, health_score')
    .eq('organization_id', organizationId);

  if (error) throw error;

  const all = (accounts || []) as TopAccount[];

  const atRisk = all
    .filter(a => (a.churn_risk_score ?? 0) >= 70 && (a.mrr_cents || 0) > 0)
    .sort((a, b) => (b.churn_risk_score ?? 0) - (a.churn_risk_score ?? 0))
    .slice(0, 5);

  const expansion = all
    .filter(a => (a.expansion_score ?? 0) >= 70 && (a.health_score ?? 0) >= 60)
    .sort((a, b) => (b.expansion_score ?? 0) - (a.expansion_score ?? 0))
    .slice(0, 5);

  return { atRisk, expansion };
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
