import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';

/**
 * Contrat `GET /dashboard-api/portfolio-metrics` (docs/API_CONTRACTS.md,
 * backend Phase 4) — endpoint métriques autoritaire du portefeuille. Chaque
 * champ est précalculé côté serveur ; le frontend ne doit jamais recalculer
 * un total de portefeuille lui-même (AUDIT_LOGIQUE_METIER_STRIPE.md point 22).
 */
export interface PortfolioMetrics {
  mrr_cents: number;
  arr_cents: number;
  trial_mrr_cents: number;
  /** null si l'org a moins de 3 mois d'historique de mrr_movements. */
  nrr_percentage: number | null;
  /** % de MRR perdu sur les 30 derniers jours glissants ; null si le MRR de début de fenêtre est <= 0. */
  churn_rate: number | null;
  accounts_at_risk: number;
  mrr_at_risk_cents: number;
  expansion_opportunities: number;
  /** null si aucun sync Stripe n'a encore tourné. */
  currency: string | null;
  mrr_unavailable_accounts: number;
  billing_profile: 'standard' | 'needs_review' | null;
  stripe_stale: boolean;
}

export async function getPortfolioMetrics(): Promise<PortfolioMetrics> {
  const res = await fetchWithUserJwt<{ data: PortfolioMetrics }>('dashboard-api/portfolio-metrics');
  return res.data;
}
