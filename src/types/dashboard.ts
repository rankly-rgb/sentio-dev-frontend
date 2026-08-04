/** Types pour le dashboard Vue d'ensemble rétention */

export interface DashboardMetrics {
  mrr_cents: number;
  arr_cents: number;
  /** Sourcé depuis portfolio-metrics — null si l'org a moins de 3 mois d'historique. */
  nrr_percentage: number | null;
  total_accounts: number;
  active_accounts: number;
  accounts_at_risk: number;
  mrr_at_risk_cents: number;
  expansion_opportunities: number;
  /** null si aucun compte n'a de health_score honnêtement calculable (jamais rendu comme 0). */
  avg_health_score: number | null;
  /** Dénominateur pour l'affichage "Avg. health: 71 (across 42 of 47 accounts)". */
  avg_health_scored_accounts: number;
  /** % de MRR perdu sur 30j glissants (portfolio-metrics) — null si le MRR de début de fenêtre est <= 0. */
  churn_rate: number | null;
  /** Devise ISO 4217 de l'org (vote majoritaire) — null si aucun sync Stripe n'a encore tourné. */
  currency: string | null;
  /** true si le dernier sync Stripe completed a plus de 48h, ou si aucun sync complet n'existe encore. */
  stripe_stale: boolean;
  billing_profile: 'standard' | 'needs_review' | null;
  /** Comptes mrr_status='unavailable' (non-chiffrables) — exclus de mrr_cents, jamais rendus comme $0. */
  mrr_unavailable_accounts: number;
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
