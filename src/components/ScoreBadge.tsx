import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type ScoreType = 'health' | 'churn' | 'expansion';

interface ScoreBadgeProps {
  score: number | null | undefined;
  inverted?: boolean;
  type?: ScoreType;
  showLabel?: boolean;
  size?: 'sm' | 'lg';
  className?: string;
  isNew?: boolean;
}

const LABELS: Record<ScoreType, [string, string, string]> = {
  health: ['Healthy', 'Attention', 'Critical'],
  churn: ['High', 'Moderate', 'Low'],
  expansion: ['Strong', 'Moderate', 'Low'],
};

function getColorAndLabel(score: number, scoreType: ScoreType | undefined, inverted: boolean): { color: string; label: string; pulseClass: string } {
  if (scoreType === 'churn') {
    if (score >= 70) return { color: 'bg-destructive/15 text-destructive', label: LABELS.churn[0], pulseClass: 'animate-pulse-ring ring-destructive/30' };
    if (score >= 40) return { color: 'bg-warning/15 text-warning', label: LABELS.churn[1], pulseClass: 'animate-pulse-ring ring-warning/30' };
    return { color: 'bg-success/15 text-success', label: LABELS.churn[2], pulseClass: 'animate-pulse-ring ring-success/30' };
  }
  if (scoreType === 'expansion') {
    if (score >= 70) return { color: 'bg-blue-100 text-blue-700', label: LABELS.expansion[0], pulseClass: 'animate-pulse-ring ring-blue-300/50' };
    if (score >= 40) return { color: 'bg-slate-100 text-slate-600', label: LABELS.expansion[1], pulseClass: 'animate-pulse-ring ring-slate-300/50' };
    return { color: 'bg-slate-100 text-slate-600', label: LABELS.expansion[2], pulseClass: 'animate-pulse-ring ring-slate-300/50' };
  }
  if (scoreType === 'health' || !inverted) {
    if (score >= 70) return { color: 'bg-success/15 text-success', label: LABELS.health[0], pulseClass: 'animate-pulse-ring ring-success/30' };
    if (score >= 40) return { color: 'bg-warning/15 text-warning', label: LABELS.health[1], pulseClass: 'animate-pulse-ring ring-warning/30' };
    return { color: 'bg-destructive/15 text-destructive', label: LABELS.health[2], pulseClass: 'animate-pulse-ring ring-destructive/40' };
  }
  if (score <= 30) return { color: 'bg-success/15 text-success', label: '', pulseClass: 'animate-pulse-ring ring-success/30' };
  if (score <= 60) return { color: 'bg-warning/15 text-warning', label: '', pulseClass: 'animate-pulse-ring ring-warning/30' };
  return { color: 'bg-destructive/15 text-destructive', label: '', pulseClass: 'animate-pulse-ring ring-destructive/40' };
}

export default function ScoreBadge({ score, inverted = false, type: scoreType, showLabel = false, size = 'sm', className, isNew = false }: ScoreBadgeProps) {
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

  const { color, label, pulseClass } = getColorAndLabel(score, scoreType, inverted);

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
      {Math.round(score)}{showLabel && label ? ` ${label}` : ''}
    </Badge>
  );
}
