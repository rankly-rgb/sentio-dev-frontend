import { useT } from './useT';
import type { SegmentType } from '@/lib/types/segments';

export function useSegmentLabels(): Record<SegmentType, string> {
  const t = useT();
  return {
    champions: t.segments.champions,
    en_expansion: t.segments.expanding,
    stables: t.segments.stable,
    a_risque_leger: t.segments.atRiskLight,
    en_danger_critique: t.segments.critical,
    impayes: t.segments.unpaid,
    en_churn: t.segments.churned,
    nouveaux: t.segments.newAccounts,
  };
}
