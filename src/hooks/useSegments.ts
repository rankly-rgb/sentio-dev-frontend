import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { SegmentType } from '@/lib/types/segments';
import { SEGMENT_KEYS, SEGMENT_LABELS } from '@/lib/types/segments';

export interface SaaSSegment {
  name: SegmentType;
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
  const segmentDefs: { name: SegmentType; filter: (a: AccountRow) => boolean }[] = [
    { name: 'champions', filter: a => (a.health_score ?? 0) > 80 && (a.expansion_score ?? 0) > 70 },
    { name: 'en_expansion', filter: a => (a.expansion_score ?? 0) > 75 },
    { name: 'stables', filter: a => (a.health_score ?? 0) >= 60 && (a.health_score ?? 0) <= 80 && (a.churn_risk_score ?? 0) < 30 },
    { name: 'a_risque_leger', filter: a => ((a.health_score ?? 0) >= 40 && (a.health_score ?? 0) < 60) || ((a.churn_risk_score ?? 0) >= 30 && (a.churn_risk_score ?? 0) <= 50) },
    { name: 'en_danger_critique', filter: a => (a.health_score ?? 0) < 40 || (a.churn_risk_score ?? 0) > 70 },
    { name: 'impayes', filter: a => (a.churn_risk_score ?? 0) > 80 && (a.health_score ?? 0) < 50 },
    { name: 'en_churn', filter: a => (a.churn_risk_score ?? 0) > 90 },
    { name: 'nouveaux', filter: a => new Date(a.created_at) > ninetyDaysAgo },
  ];

  return segmentDefs.map(seg => {
    const matched = all.filter(seg.filter);
    const scores = matched
      .filter((a): a is AccountRow & { health_score: number } => a.health_score !== null)
      .map(a => a.health_score);
    return {
      name: seg.name,
      label: SEGMENT_LABELS[seg.name],
      count: matched.length,
      mrr_cents: matched.reduce((s, a) => s + (a.mrr_cents || 0), 0),
      avg_health_score: scores.length > 0 ? Math.round(scores.reduce((s, h) => s + h, 0) / scores.length) : 0,
    };
  });
}

/** Vérifier que les clés correspondent aux routes */
void SEGMENT_KEYS;

export function useSegments() {
  return useQuery({
    queryKey: ['segments'],
    queryFn: fetchSegments,
    staleTime: 120_000,
  });
}
