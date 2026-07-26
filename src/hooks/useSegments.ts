import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { SegmentType } from '@/lib/types/segments';
import { SEGMENT_KEYS, SEGMENT_LABELS } from '@/lib/types/segments';
import { getSegmentFilter } from '@/lib/queries/segment-queries';
import type { HealthScoreStatus } from '@/lib/types/accounts';

export interface SaaSSegment {
  name: SegmentType;
  label: string;
  count: number;
  mrr_cents: number;
  /** null si aucun compte du segment n'a de health_score honnêtement calculable. */
  avg_health_score: number | null;
}

// ⚠️ UNVERIFIED : voir le même avertissement dans segment-queries.ts —
// primary_segment n'est confirmé disponible que via l'edge function
// accounts-api (§4bis), pas explicitement comme colonne PostgREST directe.
async function fetchSegments(organizationId: string): Promise<SaaSSegment[]> {
  const { data, error } = await supabase
    .from('accounts')
    .select('health_score, health_score_status, primary_segment, mrr_cents, created_at')
    .eq('organization_id', organizationId);

  if (error) throw error;

  const all = (data || []) as Array<{
    health_score: number | null;
    health_score_status: HealthScoreStatus;
    primary_segment: SegmentType | null;
    mrr_cents: number;
    created_at: string;
  }>;

  return SEGMENT_KEYS.map((name) => {
    const filter = getSegmentFilter(name);
    const matched = all.filter(filter);
    const scores = matched
      .filter((a) => a.health_score_status !== 'insufficient' && a.health_score !== null)
      .map((a) => a.health_score as number);
    return {
      name,
      label: SEGMENT_LABELS[name],
      count: matched.length,
      mrr_cents: matched.reduce((s, a) => s + (a.mrr_cents || 0), 0),
      avg_health_score: scores.length > 0 ? Math.round(scores.reduce((s, h) => s + h, 0) / scores.length) : null,
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
