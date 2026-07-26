import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { SegmentType } from '@/lib/types/segments';
import { SEGMENT_KEYS, SEGMENT_LABELS } from '@/lib/types/segments';
import { getSegmentFilter } from '@/lib/queries/segment-queries';
import type { HealthScoreBand, HealthScoreStatus } from '@/lib/types/accounts';

export interface SaaSSegment {
  name: SegmentType;
  label: string;
  count: number;
  mrr_cents: number;
  /** null si aucun compte du segment n'a de health_score honnêtement calculable. */
  avg_health_score: number | null;
}

// TODO(chantier 3 — primary_segment) : ce hook recalcule les comptages de
// segment côté client via getSegmentFilter (filet de sécurité, voir TODO
// dans segment-queries.ts). Dès que `primary_segment` est disponible sur
// accounts-api, regrouper directement par cette colonne (GROUP BY / countBy)
// au lieu de refiltrer 8 fois le même jeu de comptes.
async function fetchSegments(organizationId: string): Promise<SaaSSegment[]> {
  const { data, error } = await supabase
    .from('accounts')
    .select('health_score, health_score_status, health_score_band, churn_risk_band, expansion_score, expansion_score_status, mrr_cents, created_at')
    .eq('organization_id', organizationId);

  if (error) throw error;

  const all = (data || []) as Array<{
    health_score: number | null;
    health_score_status: HealthScoreStatus;
    health_score_band: HealthScoreBand | null;
    churn_risk_band: 'low' | 'watch' | 'high';
    expansion_score: number | null;
    expansion_score_status: 'available' | 'unavailable';
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
