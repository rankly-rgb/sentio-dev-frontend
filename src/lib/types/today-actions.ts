/**
 * Types et helpers pour la page "Aujourd'hui" — actions groupées par priorité.
 * Réimplémentation client-side de _shared/today-actions-helpers.ts (backend).
 */

import type { Account } from '@/types/database';
import type { Playbook, ConditionGroup, Condition } from '@/lib/types/playbook';
import type { PriorityCode } from '@/lib/priority-labels';
import type { TemplateCategory } from '@/lib/types/playbook';

// --- Types ---

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
  plan_tier: string | null;
  days_to_renewal: number | null;
  trigger_reasons: string[];
  matching_playbooks: MatchingPlaybook[];
}

export interface TodayActionsSummary {
  total: number;
  by_priority: Record<PriorityCode, number>;
  by_category: Record<string, number>;
  mrr_at_risk_cents: number;
  actions: TodayAction[];
}

export interface TodayActionsFilters {
  priority?: PriorityCode;
  segment?: string;
  category?: string;
  mrrMin?: number;
}

// --- Category labels ---

export const CATEGORY_LABELS: Record<string, string> = {
  churn_prevention: 'Prévention churn',
  expansion: 'Expansion',
  onboarding: 'Onboarding',
  reactivation: 'Réactivation',
  renewal: 'Renouvellement',
  winback: 'Récupération',
  payment_recovery: 'Recouvrement',
  health_monitoring: 'Suivi santé',
  customer_education: 'Éducation client',
  nps_detractors: 'Détracteurs NPS',
  champions_advocacy: 'Champions & advocacy',
  downgrade_prevention: 'Prévention downgrade',
  success_planning: 'Planification succès',
};

export function categoryLabel(cat: string): string {
  return CATEGORY_LABELS[cat] ?? cat;
}

// --- Priority helpers ---

export const PRIORITY_CONFIG: Record<PriorityCode, { label: string; color: string; textColor: string; badgeColor: string; icon: string }> = {
  P0: { label: 'Critiques', color: 'bg-red-50', textColor: 'text-red-700', badgeColor: 'bg-red-500', icon: 'alert-triangle' },
  P1: { label: 'Hautes', color: 'bg-amber-50', textColor: 'text-amber-700', badgeColor: 'bg-amber-500', icon: 'alert-circle' },
  P2: { label: 'Normales', color: 'bg-blue-50', textColor: 'text-blue-700', badgeColor: 'bg-blue-500', icon: 'info' },
};

// --- Computation helpers ---

export function computeDaysToRenewal(
  contractEndDate: string | null,
  billingInterval: string | null,
): number | null {
  if (!contractEndDate || billingInterval === 'monthly') return null;
  const end = new Date(contractEndDate);
  const diffMs = end.getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function computePriority(
  churnRisk: number | null,
  daysToRenewal: number | null,
): PriorityCode {
  const risk = churnRisk ?? 0;
  if (risk >= 70) return 'P0';
  if (risk >= 50 || (daysToRenewal !== null && daysToRenewal < 60)) return 'P1';
  return 'P2';
}

export function computeTriggerReasons(account: Account): string[] {
  const reasons: string[] = [];

  const churnRisk = account.churn_risk_score ?? 0;
  if (churnRisk >= 70) {
    reasons.push(`Risque churn critique (${Math.round(churnRisk)}%)`);
  } else if (churnRisk >= 50) {
    reasons.push(`Risque churn modéré (${Math.round(churnRisk)}%)`);
  }

  const health = account.health_score ?? 100;
  if (health < 40) {
    reasons.push(`Santé faible (${Math.round(health)}%)`);
  }

  const dtr = computeDaysToRenewal(account.contract_end_date, account.billing_interval);
  if (dtr !== null && dtr <= 60) {
    reasons.push(`Renouvellement dans ${dtr}j`);
  }

  const expansion = account.expansion_score ?? 0;
  if (expansion >= 70) {
    reasons.push(`Opportunité expansion (${Math.round(expansion)}%)`);
  }

  if (account.mrr_cents === 0) {
    reasons.push('MRR à zéro');
  }

  return reasons;
}

// --- Condition evaluation ---

function evaluateCondition(condition: Condition, account: Record<string, unknown>): boolean {
  const val = account[condition.field];
  if (val === undefined || val === null) return false;

  switch (condition.operator) {
    case 'eq': return val === condition.value;
    case 'neq': return val !== condition.value;
    case 'gt': return Number(val) > Number(condition.value);
    case 'gte': return Number(val) >= Number(condition.value);
    case 'lt': return Number(val) < Number(condition.value);
    case 'lte': return Number(val) <= Number(condition.value);
    case 'in': return Array.isArray(condition.value) && (condition.value as unknown[]).includes(val);
    case 'not_in': return Array.isArray(condition.value) && !(condition.value as unknown[]).includes(val);
    default: return false;
  }
}

function evaluateConditions(group: ConditionGroup | null, account: Record<string, unknown>): boolean {
  if (!group || !group.conditions?.length) return true;
  if (group.operator === 'OR') {
    return group.conditions.some((c) => evaluateCondition(c, account));
  }
  return group.conditions.every((c) => evaluateCondition(c, account));
}

// --- Main computation ---

export function computeTodayActions(accounts: Account[], playbooks: Playbook[]): TodayAction[] {
  const activePlaybooks = playbooks.filter((pb) => pb.status !== 'archived');
  const map = new Map<string, TodayAction>();

  for (const pb of activePlaybooks) {
    for (const acc of accounts) {
      // Cast account to Record for condition evaluation
      const accRecord = acc as unknown as Record<string, unknown>;
      if (!evaluateConditions(pb.eligibility_criteria, accRecord)) continue;

      const existing = map.get(acc.id);
      if (existing) {
        if (!existing.matching_playbooks.some((p) => p.id === pb.id)) {
          existing.matching_playbooks.push({
            id: pb.id,
            title: pb.title,
            priority: pb.priority,
            category: pb.template_category,
          });
        }
      } else {
        const dtr = computeDaysToRenewal(acc.contract_end_date, acc.billing_interval);
        map.set(acc.id, {
          account_id: acc.id,
          stripe_customer_id: acc.stripe_customer_id,
          hubspot_company_id: acc.hubspot_company_id,
          priority: computePriority(acc.churn_risk_score, dtr),
          health_score: acc.health_score,
          churn_risk_score: acc.churn_risk_score,
          expansion_score: acc.expansion_score,
          mrr_cents: acc.mrr_cents,
          plan_tier: acc.plan_tier,
          days_to_renewal: dtr,
          trigger_reasons: computeTriggerReasons(acc),
          matching_playbooks: [{
            id: pb.id,
            title: pb.title,
            priority: pb.priority,
            category: pb.template_category,
          }],
        });
      }
    }
  }

  return Array.from(map.values());
}

export function sortTodayActions(actions: TodayAction[]): TodayAction[] {
  const priorityOrder: Record<PriorityCode, number> = { P0: 0, P1: 1, P2: 2 };
  return [...actions].sort((a, b) => {
    const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pDiff !== 0) return pDiff;
    return (b.mrr_cents ?? 0) - (a.mrr_cents ?? 0);
  });
}

export function buildTodayActionsSummary(actions: TodayAction[]): TodayActionsSummary {
  const sorted = sortTodayActions(actions);
  const by_priority: Record<PriorityCode, number> = { P0: 0, P1: 0, P2: 0 };
  const by_category: Record<string, number> = {};
  let mrr_at_risk_cents = 0;

  for (const action of sorted) {
    by_priority[action.priority]++;
    if (action.priority === 'P0' || action.priority === 'P1') {
      mrr_at_risk_cents += action.mrr_cents ?? 0;
    }
    for (const pb of action.matching_playbooks) {
      const cat = pb.category ?? 'other';
      by_category[cat] = (by_category[cat] ?? 0) + 1;
    }
  }

  return {
    total: sorted.length,
    by_priority,
    by_category,
    mrr_at_risk_cents,
    actions: sorted,
  };
}

export function getUniqueCategories(playbooks: Playbook[]): TemplateCategory[] {
  const cats = new Set<TemplateCategory>();
  for (const pb of playbooks) {
    if (pb.status !== 'archived' && pb.template_category) {
      cats.add(pb.template_category);
    }
  }
  return Array.from(cats);
}
