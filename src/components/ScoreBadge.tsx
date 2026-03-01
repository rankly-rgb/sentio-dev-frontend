import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface ScoreBadgeProps {
  score: number | null | undefined;
  /** Si true, un score bas = bon (ex: churn risk) */
  inverted?: boolean;
  size?: 'sm' | 'lg';
  className?: string;
}

export default function ScoreBadge({ score, inverted = false, size = 'sm', className }: ScoreBadgeProps) {
  if (score == null) return <span className="text-muted-foreground">-</span>;

  const getColor = () => {
    const s = score;
    if (!inverted) {
      if (s >= 70) return 'bg-success/15 text-success';
      if (s >= 40) return 'bg-warning/15 text-warning';
      return 'bg-destructive/15 text-destructive';
    }
    // Inverted: lower = better (churn risk)
    if (s <= 30) return 'bg-success/15 text-success';
    if (s <= 60) return 'bg-warning/15 text-warning';
    return 'bg-destructive/15 text-destructive';
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-semibold border-0',
        getColor(),
        size === 'lg' && 'text-lg px-3 py-1',
        className,
      )}
    >
      {Math.round(score)}
    </Badge>
  );
}
