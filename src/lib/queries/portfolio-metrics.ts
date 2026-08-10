import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';

/**
 * Contrat `GET /dashboard-api/portfolio-metrics` (sentio-dev-backend API_CONTRACTS.md,
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
  /** churn_risk_band='high' OR is_delinquent (audit délinquence 2026-08-06). */
  accounts_at_risk: number;
  /** Subset of accounts_at_risk with mrr_status='unavailable' — excluded from mrr_at_risk_cents, never silently. */
  accounts_at_risk_unpriced: number;
  /** Sums only the chargeable (mrr_status != 'unavailable') subset of accounts_at_risk. */
  mrr_at_risk_cents: number;
  expansion_opportunities: number;
  /** false si aucun compte n'a expansion_score_status='available' — l'org n'a jamais configuré stripe_product_mappings (audit 2026-08-06, priorité 2). */
  expansion_configured: boolean;
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
