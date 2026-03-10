import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type ScoreType = 'health' | 'churn' | 'expansion';

interface ScoreBadgeProps {
  score: number | null | undefined;
  /** Si true, un score bas = bon (ex: churn risk). Ignoré si `type` est défini. */
  inverted?: boolean;
  /** Type sémantique — détermine les couleurs et labels automatiquement */
  type?: ScoreType;
  /** Affiche un label textuel à côté du score (ex: "Sain", "Élevé") */
  showLabel?: boolean;
  size?: 'sm' | 'lg';
  className?: string;
}

const LABELS: Record<ScoreType, [string, string, string]> = {
  health: ['Sain', 'Attention', 'Critique'],
  churn: ['Élevé', 'Modéré', 'Faible'],
  expansion: ['Fort', 'Modéré', 'Faible'],
};

function getColorAndLabel(score: number, scoreType: ScoreType | undefined, inverted: boolean): { color: string; label: string } {
  if (scoreType === 'churn') {
    if (score >= 70) return { color: 'bg-destructive/15 text-destructive', label: LABELS.churn[0] };
    if (score >= 40) return { color: 'bg-warning/15 text-warning', label: LABELS.churn[1] };
    return { color: 'bg-success/15 text-success', label: LABELS.churn[2] };
  }
  if (scoreType === 'expansion') {
    if (score >= 70) return { color: 'bg-blue-100 text-blue-700', label: LABELS.expansion[0] };
    if (score >= 40) return { color: 'bg-slate-100 text-slate-600', label: LABELS.expansion[1] };
    return { color: 'bg-slate-100 text-slate-600', label: LABELS.expansion[2] };
  }
  if (scoreType === 'health' || !inverted) {
    if (score >= 70) return { color: 'bg-success/15 text-success', label: LABELS.health[0] };
    if (score >= 40) return { color: 'bg-warning/15 text-warning', label: LABELS.health[1] };
    return { color: 'bg-destructive/15 text-destructive', label: LABELS.health[2] };
  }
  // Inverted (backward compat): lower = better
  if (score <= 30) return { color: 'bg-success/15 text-success', label: '' };
  if (score <= 60) return { color: 'bg-warning/15 text-warning', label: '' };
  return { color: 'bg-destructive/15 text-destructive', label: '' };
}

export default function ScoreBadge({ score, inverted = false, type: scoreType, showLabel = false, size = 'sm', className }: ScoreBadgeProps) {
  if (score == null) return <span className="text-muted-foreground">—</span>;

  const { color, label } = getColorAndLabel(score, scoreType, inverted);

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-semibold border-0',
        color,
        size === 'lg' && 'text-lg px-3 py-1',
        className,
      )}
    >
      {Math.round(score)}{showLabel && label ? ` ${label}` : ''}
    </Badge>
  );
}
