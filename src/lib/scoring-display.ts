/**
 * Présentation des champs Scoring Engine V2 (docs/SCORING_ENGINE_CONTRACT.md).
 * Seule source de mapping band/severity → couleur — ne pas recalculer de
 * bandes ailleurs à partir des scores bruts (le backend est la seule
 * autorité sur health_score_band / churn_risk_band).
 */
import type { HealthScoreBand, RiskSignalSeverity } from '@/lib/types/accounts';

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

// Record<string, ... | undefined>, not Record<ChurnRiskBand, ...>: churn_risk_band
// is null for a third of the portfolio (churned accounts, D1/C2.1, and
// never-scored accounts), and a caller with only a wider prop type
// (ScoreBadge's `band?: HealthScoreBand | ChurnRiskBand | null`) has no
// type-safe way to narrow to ChurnRiskBand before indexing. A Record<ChurnRiskBand,...>
// would force that narrowing via `as ChurnRiskBand` — the exact assertion
// that silenced the compiler on the 2026-08-05 incident (AccountScoreCard.tsx/
// ScoreBadge.tsx crashed on 41% of real accounts). Indexing by plain
// `string` needs no cast anywhere and always yields `| undefined`. Use
// churnBandStyle() below rather than indexing this directly.
export const CHURN_BAND_STYLE: Record<string, { color: string; label: string } | undefined> = {
  low: { color: 'bg-success/15 text-success', label: 'Low' },
  watch: { color: 'bg-warning/15 text-warning', label: 'Watch' },
  high: { color: 'bg-destructive/15 text-destructive', label: 'High' },
  // Lot 5 (2026-08-13, #35) — plancher de bande par durée de délinquence,
  // strictement au-dessus de 'high' : solid background (pas /15) pour rester
  // visuellement distinct, jamais un synonyme de 'high'.
  critical: { color: 'bg-destructive text-destructive-foreground', label: 'Critical' },
  churned: { color: 'bg-muted text-muted-foreground', label: 'Churned' },
};

const CHURN_BAND_NOT_SCORED_STYLE = { color: 'bg-muted text-muted-foreground', label: 'Not scored' };
const CHURN_BAND_UNKNOWN_STYLE = { color: 'bg-muted text-muted-foreground', label: 'Unknown' };

/**
 * Single point of truth for churn_risk_band → color/label, including the
 * two non-crashing paths CHURN_BAND_STYLE alone can't express: `null`
 * (churned or never-scored — a real, common state, not an error) and a
 * value the frontend doesn't recognize yet (defensive — see InsightType
 * incident, same class of bug).
 *
 * Parameter is deliberately `string | null | undefined`, not
 * `ChurnRiskBand | null` — callers that only have a wider prop type (e.g.
 * ScoreBadge's `band?: HealthScoreBand | ChurnRiskBand | null`) used to
 * reach for `band as ChurnRiskBand` to satisfy a narrower signature, which
 * is exactly the kind of assertion that silences the compiler on the bug
 * this function exists to prevent. Accepting `string` means no caller ever
 * needs to assert a type they can't actually vouch for.
 */
export function churnBandStyle(band: string | null | undefined): { color: string; label: string } {
  if (!band) return CHURN_BAND_NOT_SCORED_STYLE;
  return CHURN_BAND_STYLE[band] ?? CHURN_BAND_UNKNOWN_STYLE;
}

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

/**
 * Durée de délinquence en jours entiers, à partir de `accounts.delinquent_since`
 * (Lot 5, 2026-08-13, #35). `null` en entrée (date inconnue — S1) doit
 * produire `null` en sortie, jamais `0` — "0 days" se lirait comme "started
 * today", une date fabriquée que le backend n'a justement jamais écrite.
 * `now` injectable pour les tests (jamais un Date.now() implicite non testable).
 */
export function delinquentDurationDays(delinquentSince: string | null, now: number = Date.now()): number | null {
  if (!delinquentSince) return null;
  return Math.floor((now - new Date(delinquentSince).getTime()) / 86400000);
}

/** Affichage textuel de la durée — `—` (jamais "0 days") quand la date est inconnue. */
export function formatDelinquentDuration(delinquentSince: string | null, now: number = Date.now()): string {
  const days = delinquentDurationDays(delinquentSince, now);
  if (days === null) return '—';
  return days === 1 ? '1 day' : `${days} days`;
}
