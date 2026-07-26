import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import type { SegmentType } from '@/lib/types/segments';
import { SEGMENT_KEYS, SEGMENT_LABELS } from '@/lib/types/segments';
import { getSegmentFilter } from '@/lib/queries/segment-queries';
import { getAllAccountsForOrg } from '@/lib/queries/accounts';

export interface SaaSSegment {
  name: SegmentType;
  label: string;
  count: number;
  mrr_cents: number;
  /** null si aucun compte du segment n'a de health_score honnêtement calculable. */
  avg_health_score: number | null;
}

// Chargé via accounts-api (getAllAccountsForOrg) — voir le commentaire dans
// segment-queries.ts sur pourquoi primary_segment n'est pas lu par un
// .select() brut sur la table `accounts`.
async function fetchSegments(): Promise<SaaSSegment[]> {
  const all = await getAllAccountsForOrg();

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
    queryFn: fetchSegments,
    enabled: !!orgId,
    staleTime: 120_000,
  });
}
