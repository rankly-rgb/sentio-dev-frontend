/**
 * Types et helpers pour la page "Aujourd'hui" — actions groupées par priorité.
 *
 * C2.4b (2026-08-02) : le calcul (matching playbooks + insights actifs) vit
 * désormais côté backend (`GET /get-today-actions`, voir
 * `_shared/today-actions-helpers.ts`) — c'est la source de vérité unique.
 * Ce fichier ne contient plus que les types de la réponse et des helpers
 * d'affichage purs (labels, config UI), plus aucun calcul de priorité ou de
 * matching eligibility_criteria.
 */

import type { PriorityCode } from '@/lib/priority-labels';
import type { TemplateCategory } from '@/lib/types/playbook';
import { getSegmentFilter } from '@/lib/queries/segment-queries';
import { isValidSegmentKey, type SegmentType } from '@/lib/types/segments';
import type { MrrStatus } from '@/lib/types/accounts';

// --- Types (miroir de la réponse GET /get-today-actions) ---

export interface MatchingPlaybook {
  id: string;
  title: string;
  priority: string;
  category: string | null;
}

export interface TodayAction {
  account_id: string;
  stripe_customer_id: string;
  display_name?: string | null;
  hubspot_company_id: string | null;
  priority: PriorityCode;
  health_score: number | null;
  churn_risk_score: number | null;
  expansion_score: number | null;
  mrr_cents: number;
  mrr_status: MrrStatus;
  plan_tier: string | null;
  days_to_renewal: number | null;
  trigger_reasons: string[];
  matching_playbooks: MatchingPlaybook[];
  created_at: string;
  primary_segment: string | null;
}

export type PortfolioStatus = 'critical' | 'attention_needed' | 'stable';

export interface TodayActionsSummary {
  total: number;
  by_priority: Record<PriorityCode, number>;
  by_category: Record<string, number>;
  mrr_at_risk_cents: number;
  actions: TodayAction[];
}

export interface TodayActionsResponse {
  data: TodayActionsSummary & { status: PortfolioStatus };
}

export interface TodayActionsFilters {
  priority?: PriorityCode;
  segment?: string;
  category?: string;
  mrrMin?: number;
}

// --- Category labels ---

export const CATEGORY_LABELS: Record<string, string> = {
  churn_prevention: 'Churn prevention',
  expansion: 'Expansion',
  onboarding: 'Onboarding',
  reactivation: 'Reactivation',
  renewal: 'Renewal',
  winback: 'Winback',
  payment_recovery: 'Payment recovery',
  health_monitoring: 'Health monitoring',
  customer_education: 'Customer education',
  nps_detractors: 'NPS detractors',
  champions_advocacy: 'Champions & advocacy',
  downgrade_prevention: 'Downgrade prevention',
  success_planning: 'Success planning',
};

export function categoryLabel(cat: string): string {
  return CATEGORY_LABELS[cat] ?? cat;
}

// --- Priority display config ---

export const PRIORITY_CONFIG: Record<PriorityCode, { label: string; color: string; textColor: string; badgeColor: string; icon: string }> = {
  P0: { label: 'Critical', color: 'bg-red-50', textColor: 'text-red-700', badgeColor: 'bg-red-500', icon: 'alert-triangle' },
  P1: { label: 'High', color: 'bg-amber-50', textColor: 'text-amber-700', badgeColor: 'bg-amber-500', icon: 'alert-circle' },
  P2: { label: 'Normal', color: 'bg-blue-50', textColor: 'text-blue-700', badgeColor: 'bg-blue-500', icon: 'info' },
};

// --- Client-side filtering of the already-fetched action list ---
// (cosmetic narrowing of a view, not a recomputation of what counts as an
// action — that determination is entirely server-side, see module doc.)

export function filterTodayActions(actions: TodayAction[], filters: TodayActionsFilters): TodayAction[] {
  let result = actions;

  if (filters.priority) {
    result = result.filter((a) => a.priority === filters.priority);
  }

  if (filters.segment && isValidSegmentKey(filters.segment)) {
    const segFilter = getSegmentFilter(filters.segment as SegmentType);
    result = result.filter((a) => segFilter({ primary_segment: a.primary_segment as SegmentType | null, created_at: a.created_at }));
  }

  if (filters.category) {
    result = result.filter((a) => a.matching_playbooks.some((pb) => pb.category === filters.category));
  }

  if (filters.mrrMin !== undefined && filters.mrrMin > 0) {
    const minCents = filters.mrrMin * 100;
    result = result.filter((a) => a.mrr_cents >= minCents);
  }

  return result;
}

// Dérivées de la liste complète (non filtrée) — les options du filtre
// catégorie ne doivent pas se réduire quand un autre filtre est actif.
export function getUniqueCategories(actions: TodayAction[]): TemplateCategory[] {
  const cats = new Set<TemplateCategory>();
  for (const action of actions) {
    for (const pb of action.matching_playbooks) {
      if (pb.category) cats.add(pb.category as TemplateCategory);
    }
  }
  return Array.from(cats);
}
