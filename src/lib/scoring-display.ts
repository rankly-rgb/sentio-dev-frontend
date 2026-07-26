/**
 * Présentation des champs Scoring Engine V2 (docs/API_CONTRACTS.md).
 * Seule source de mapping band/severity → couleur — ne pas recalculer de
 * bandes ailleurs à partir des scores bruts (le backend est la seule
 * autorité sur health_score_band / churn_risk_band).
 */
import type { ChurnRiskBand, HealthScoreBand, RiskSignalSeverity } from '@/lib/types/accounts';

export const HEALTH_BAND_STYLE: Record<HealthScoreBand, { color: string; label: string }> = {
  healthy: { color: 'bg-success/15 text-success', label: 'Healthy' },
  watch: { color: 'bg-warning/15 text-warning', label: 'Watch' },
  at_risk: { color: 'bg-destructive/15 text-destructive', label: 'At risk' },
};

/** Cercle/anneau de score (bordure + texte) — variante de HEALTH_BAND_STYLE pour les gros indicateurs circulaires. */
export const HEALTH_BAND_RING_STYLE: Record<HealthScoreBand, string> = {
  healthy: 'text-success border-success/30',
  watch: 'text-warning border-warning/30',
  at_risk: 'text-destructive border-destructive/30',
};

export const CHURN_BAND_STYLE: Record<ChurnRiskBand, { color: string; label: string }> = {
  low: { color: 'bg-success/15 text-success', label: 'Low' },
  watch: { color: 'bg-warning/15 text-warning', label: 'Watch' },
  high: { color: 'bg-destructive/15 text-destructive', label: 'High' },
};

export const RISK_SEVERITY_STYLE: Record<RiskSignalSeverity, { color: string; label: string }> = {
  CRITIQUE: { color: 'bg-destructive/15 text-destructive', label: 'Critical' },
  MAJEUR: { color: 'bg-warning/15 text-warning', label: 'Major' },
  MINEUR: { color: 'bg-muted text-muted-foreground', label: 'Minor' },
};

export const TREND_ARROW: Record<'up' | 'flat' | 'down', string> = {
  up: '↗',
  flat: '→',
  down: '↘',
};

export function healthScoreTrendColor(trend: 'up' | 'flat' | 'down'): string {
  if (trend === 'up') return 'text-success';
  if (trend === 'down') return 'text-destructive';
  return 'text-muted-foreground';
}

export const EXPANSION_UNAVAILABLE_REASON_LABEL: Record<string, string> = {
  seat_data_not_configured: 'Plan mapping not configured yet',
  unlimited_plan_no_ceiling: 'This plan has no seat ceiling — expansion score not applicable',
};

/** Score entier arrondi pour affichage — jamais de décimales à l'écran. */
export function roundScore(score: number): number {
  return Math.round(score);
}
