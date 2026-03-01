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
  avg_health_score: number;
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
