/** Types pour le dashboard Vue d'ensemble rétention */

export interface DashboardMetrics {
  mrr_cents: number;
  arr_cents: number;
  nrr_percentage: number;
  logo_retention_rate: number;
  total_accounts: number;
  active_accounts: number;
  accounts_at_risk: number;
  mrr_at_risk_cents: number;
  expansion_opportunities: number;
  /** null si aucun compte n'a de health_score honnêtement calculable (jamais rendu comme 0). */
  avg_health_score: number | null;
  /** Dénominateur pour l'affichage "Avg. health: 71 (across 42 of 47 accounts)". */
  avg_health_scored_accounts: number;
  churn_rate: number;
}

export interface MrrMovementSummary {
  new_cents: number;
  expansion_cents: number;
  contraction_cents: number;
  churn_cents: number;
  reactivation_cents: number;
  net_cents: number;
}

export interface HealthDistribution {
  champions: number;
  expanding: number;
  stable: number;
  at_risk_light: number;
  critical: number;
  unpaid: number;
  churned: number;
  new_accounts: number;
  /** health_score_status = 'insufficient' — jamais fusionné avec un autre segment (§4). */
  insufficient_data: number;
}

export interface ScoreDistribution {
  range: string;
  count: number;
}

export interface MrrTrend {
  date: string;
  mrr_cents: number;
  new_cents: number;
  expansion_cents: number;
  contraction_cents: number;
  churn_cents: number;
}

/** Point de la série temporelle MRR (RPC get_mrr_trend) */
export interface MrrTrendPoint {
  snapshot_date: string;
  total_mrr_cents: number;
  account_count: number;
}

/** Résumé calculé côté client à partir des points MRR */
export interface MrrTrendSummary {
  start: number;
  end: number;
  delta: number;
  deltaPct: number | null;
}
