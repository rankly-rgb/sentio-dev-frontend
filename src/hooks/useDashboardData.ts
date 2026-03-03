import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { DashboardMetrics, HealthDistribution } from '@/types/dashboard';

async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const { data: accounts, error } = await supabase
    .from('accounts')
    .select('id, mrr_cents, health_score, churn_risk_score, expansion_score');

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
    nrr_percentage: 100, // Calculé séparément via calculateNrr()
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

async function fetchHealthDistribution(): Promise<HealthDistribution> {
  const { data: accounts, error } = await supabase
    .from('accounts')
    .select('health_score, churn_risk_score, expansion_score, mrr_cents, created_at');

  if (error) throw error;

  const all = accounts || [];
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  return {
    champions: all.filter(a => (a.health_score ?? 0) > 80 && (a.expansion_score ?? 0) > 70).length,
    expanding: all.filter(a => (a.expansion_score ?? 0) > 75).length,
    stable: all.filter(a => (a.health_score ?? 0) >= 60 && (a.health_score ?? 0) <= 80).length,
    at_risk_light: all.filter(a => (a.health_score ?? 0) >= 40 && (a.health_score ?? 0) < 60).length,
    critical: all.filter(a => (a.health_score ?? 0) < 40 || (a.churn_risk_score ?? 0) > 70).length,
    unpaid: 0, // Nécessite jointure avec invoices — à enrichir
    churned: 0, // Nécessite jointure avec subscriptions — à enrichir
    new_accounts: all.filter(a => new Date(a.created_at) > ninetyDaysAgo).length,
  };
}

export function useDashboardData() {
  const metricsQuery = useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: fetchDashboardMetrics,
    staleTime: 120_000,
  });

  const distributionQuery = useQuery({
    queryKey: ['dashboard', 'distribution'],
    queryFn: fetchHealthDistribution,
    staleTime: 120_000,
  });

  return {
    metrics: metricsQuery.data || null,
    distribution: distributionQuery.data || null,
    isLoading: metricsQuery.isLoading || distributionQuery.isLoading,
    error: metricsQuery.error || distributionQuery.error,
    refetch: () => {
      metricsQuery.refetch();
      distributionQuery.refetch();
    },
  };
}
