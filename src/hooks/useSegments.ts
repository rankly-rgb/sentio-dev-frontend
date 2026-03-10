import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { SegmentType } from '@/lib/types/segments';
import { SEGMENT_KEYS, SEGMENT_LABELS } from '@/lib/types/segments';
import { getSegmentFilter } from '@/lib/queries/segment-queries';

export interface SaaSSegment {
  name: SegmentType;
  label: string;
  count: number;
  mrr_cents: number;
  avg_health_score: number;
}

async function fetchSegments(organizationId: string): Promise<SaaSSegment[]> {
  const { data, error } = await supabase
    .from('accounts')
    .select('health_score, churn_risk_score, expansion_score, mrr_cents, created_at')
    .eq('organization_id', organizationId);

  if (error) throw error;

  const all = data || [];

  return SEGMENT_KEYS.map((name) => {
    const filter = getSegmentFilter(name);
    const matched = all.filter(filter);
    const scores = matched
      .filter((a): a is typeof a & { health_score: number } => a.health_score !== null)
      .map((a) => a.health_score);
    return {
      name,
      label: SEGMENT_LABELS[name],
      count: matched.length,
      mrr_cents: matched.reduce((s, a) => s + (a.mrr_cents || 0), 0),
      avg_health_score: scores.length > 0 ? Math.round(scores.reduce((s, h) => s + h, 0) / scores.length) : 0,
    };
  });
}

export function useSegments() {
  const { user } = useAuth();
  const orgId = user?.organization_id;

  return useQuery({
    queryKey: ['segments', orgId],
    queryFn: () => fetchSegments(orgId!),
    enabled: !!orgId,
    staleTime: 120_000,
  });
}
