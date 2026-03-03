import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface SaaSSegment {
  name: string;
  label: string;
  count: number;
  mrr_cents: number;
  avg_health_score: number;
}

async function fetchSegments(): Promise<SaaSSegment[]> {
  const { data, error } = await supabase
    .from('accounts')
    .select('health_score, churn_risk_score, expansion_score, mrr_cents, created_at');

  if (error) throw error;

  const all = data || [];
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  type AccountRow = { health_score: number | null; churn_risk_score: number | null; expansion_score: number | null; mrr_cents: number | null; created_at: string };
  const segmentDefs: { name: string; label: string; filter: (a: AccountRow) => boolean }[] = [
    { name: 'champions', label: 'Champions', filter: a => (a.health_score ?? 0) > 80 && (a.expansion_score ?? 0) > 70 },
    { name: 'expanding', label: 'En expansion', filter: a => (a.expansion_score ?? 0) > 75 },
    { name: 'stable', label: 'Stables', filter: a => (a.health_score ?? 0) >= 60 && (a.health_score ?? 0) <= 80 && (a.churn_risk_score ?? 0) < 30 },
    { name: 'at_risk_light', label: 'À risque léger', filter: a => ((a.health_score ?? 0) >= 40 && (a.health_score ?? 0) < 60) || ((a.churn_risk_score ?? 0) >= 30 && (a.churn_risk_score ?? 0) <= 50) },
    { name: 'critical', label: 'En danger critique', filter: a => (a.health_score ?? 0) < 40 || (a.churn_risk_score ?? 0) > 70 },
    { name: 'new_accounts', label: 'Nouveaux (< 90j)', filter: a => new Date(a.created_at) > ninetyDaysAgo },
  ];

  return segmentDefs.map(seg => {
    const matched = all.filter(seg.filter);
    const scores = matched.filter(a => a.health_score !== null).map(a => a.health_score!);
    return {
      name: seg.name,
      label: seg.label,
      count: matched.length,
      mrr_cents: matched.reduce((s, a) => s + (a.mrr_cents || 0), 0),
      avg_health_score: scores.length > 0 ? Math.round(scores.reduce((s, h) => s + h, 0) / scores.length) : 0,
    };
  });
}

export function useSegments() {
  return useQuery({
    queryKey: ['segments'],
    queryFn: fetchSegments,
    staleTime: 120_000,
  });
}
