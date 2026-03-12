/** Pure helpers for account detail panel — duplicated from backend export-helpers.ts */

export type PriorityLevel = 'P0' | 'P1' | 'P2';

export function computeDaysToRenewal(
  contractEndDate: string | null,
  billingInterval: string | null,
): number | null {
  if (!contractEndDate) return null;
  const end = new Date(contractEndDate);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  if (diffMs < 0 && billingInterval === 'monthly') return null;
  return Math.ceil(diffMs / 86_400_000);
}

export function computePriority(
  churnRisk: number | null,
  daysToRenewal: number | null,
): PriorityLevel {
  if ((churnRisk ?? 0) >= 70) return 'P0';
  if (daysToRenewal !== null && daysToRenewal <= 30) return 'P0';
  if ((churnRisk ?? 0) >= 40) return 'P1';
  if (daysToRenewal !== null && daysToRenewal <= 90) return 'P1';
  return 'P2';
}

export function classifyUrgency(
  churnRiskScore: number | null,
): 'urgent' | 'watch' | 'stable' {
  const score = churnRiskScore ?? 0;
  if (score >= 70) return 'urgent';
  if (score >= 40) return 'watch';
  return 'stable';
}

export function computeTriggerReasons(account: {
  churn_risk_score: number | null;
  health_score: number | null;
  expansion_score: number | null;
  contract_end_date: string | null;
  billing_interval: string | null;
  mrr_cents: number;
}): string[] {
  const reasons: string[] = [];
  if ((account.churn_risk_score ?? 0) >= 70) {
    reasons.push(`Risque churn ${account.churn_risk_score}/100`);
  }
  if ((account.health_score ?? 100) < 40) {
    reasons.push(`Score santé critique (${account.health_score}/100)`);
  }
  const daysToRenewal = computeDaysToRenewal(
    account.contract_end_date,
    account.billing_interval,
  );
  if (daysToRenewal !== null && daysToRenewal <= 30) {
    reasons.push(`Renouvellement dans ${daysToRenewal}j`);
  }
  if ((account.expansion_score ?? 0) >= 70) {
    reasons.push(`Potentiel expansion ${account.expansion_score}/100`);
  }
  return reasons;
}

/** Format relative time in French */
export function relativeTimeFr(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMin = Math.floor((now - then) / 60_000);

  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return `il y a ${diffD}j`;
  const diffM = Math.floor(diffD / 30);
  if (diffM < 12) return `il y a ${diffM} mois`;
  return `il y a ${Math.floor(diffM / 12)} an(s)`;
}

/** Format months since date in French */
export function monthsSince(dateStr: string): string {
  const then = new Date(dateStr);
  const now = new Date();
  const months =
    (now.getFullYear() - then.getFullYear()) * 12 +
    (now.getMonth() - then.getMonth());
  if (months < 1) return 'moins d\'un mois';
  if (months === 1) return '1 mois';
  return `${months} mois`;
}
