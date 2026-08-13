import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { churnBandStyle, HEALTH_BAND_STYLE, roundScore } from '@/lib/scoring-display';
import type { ChurnRiskBand, HealthScoreBand } from '@/lib/types/accounts';

type ScoreType = 'health' | 'churn' | 'expansion';

interface ScoreBadgeProps {
  score: number | null | undefined;
  /**
   * Bande calculée par le backend (health_score_band / churn_risk_band).
   * Quand fournie pour type 'health'|'churn', pilote la couleur/label —
   * ne jamais recalculer de seuils côté frontend pour ces deux types.
   */
  band?: HealthScoreBand | ChurnRiskBand | null;
  inverted?: boolean;
  type?: ScoreType;
  showLabel?: boolean;
  size?: 'sm' | 'lg';
  className?: string;
  isNew?: boolean;
}

// Expansion n'a pas de bande backend dans le contrat V2 — seuils de
// présentation uniquement, contrairement à health/churn.
function expansionColorAndLabel(score: number): { color: string; label: string } {
  if (score >= 70) return { color: 'bg-blue-100 text-blue-700', label: 'Strong' };
  if (score >= 40) return { color: 'bg-slate-100 text-slate-600', label: 'Moderate' };
  return { color: 'bg-slate-100 text-slate-600', label: 'Low' };
}

function healthPulseClass(band: HealthScoreBand): string {
  if (band === 'at_risk') return 'animate-pulse-ring ring-destructive/40';
  if (band === 'watch') return 'animate-pulse-ring ring-warning/30';
  return 'animate-pulse-ring ring-success/30';
}

function churnPulseClass(band: string | null | undefined): string {
  if (band === 'critical') return 'animate-pulse-ring ring-destructive/50';
  if (band === 'high') return 'animate-pulse-ring ring-destructive/30';
  if (band === 'watch') return 'animate-pulse-ring ring-warning/30';
  if (band === 'churned' || !band) return 'animate-pulse-ring ring-muted/30';
  return 'animate-pulse-ring ring-success/30';
}

export default function ScoreBadge({
  score,
  band,
  inverted = false,
  type: scoreType,
  showLabel = false,
  size = 'sm',
  className,
  isNew = false,
}: ScoreBadgeProps) {
  const [pulsing, setPulsing] = useState(isNew);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isNew) return;
    setPulsing(true);
    timerRef.current = setTimeout(() => setPulsing(false), 3000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isNew]);

  if (score == null) return <span className="text-muted-foreground">—</span>;

  let color: string;
  let label: string;
  let pulseClass: string;

  if (scoreType === 'churn' && band) {
    const style = churnBandStyle(band);
    color = style.color;
    label = style.label;
    pulseClass = churnPulseClass(band);
  } else if ((scoreType === 'health' || !inverted) && band) {
    const style = HEALTH_BAND_STYLE[band as HealthScoreBand];
    color = style.color;
    label = style.label;
    pulseClass = healthPulseClass(band as HealthScoreBand);
  } else if (scoreType === 'expansion') {
    const style = expansionColorAndLabel(score);
    color = style.color;
    label = style.label;
    pulseClass = 'animate-pulse-ring ring-blue-300/50';
  } else {
    // Fallback présentation uniquement quand aucune bande backend n'est
    // fournie par l'appelant — n'affecte aucune décision produit.
    color = score >= 70 ? 'bg-success/15 text-success' : score >= 40 ? 'bg-warning/15 text-warning' : 'bg-destructive/15 text-destructive';
    label = '';
    pulseClass = 'animate-pulse-ring ring-muted/30';
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-semibold border-0 ring-2 ring-transparent transition-all',
        color,
        size === 'lg' && 'text-lg px-3 py-1',
        pulsing && pulseClass,
        pulsing && 'ring-2',
        className,
      )}
    >
      {roundScore(score)}{showLabel && label ? ` ${label}` : ''}
    </Badge>
  );
}
