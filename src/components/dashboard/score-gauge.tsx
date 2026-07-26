import { PieChart, Pie, Cell } from 'recharts';
import type { LucideIcon } from 'lucide-react';

interface ScoreGaugeProps {
  /** null = pas de score honnêtement calculable (ex. aucun compte scoré) — jamais rendu comme 0. */
  value: number | null;
  maxValue?: number;
  label: string;
  sublabel?: string;
  color: string;
  icon?: LucideIcon;
  size?: number;
}

export function ScoreGauge({
  value,
  maxValue = 100,
  label,
  sublabel,
  color,
  icon: Icon,
  size = 140,
}: ScoreGaugeProps) {
  const strokeWidth = 12;
  const innerRadius = size / 2 - strokeWidth;
  const outerRadius = size / 2;

  if (value === null) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div
          className="relative flex items-center justify-center rounded-full border-4 border-dashed border-muted-foreground/30"
          style={{ width: size, height: size }}
        >
          {Icon && <Icon className="h-4 w-4 mb-1 absolute top-1/2 -translate-y-6 text-muted-foreground" />}
          <span className="text-2xl font-bold text-muted-foreground">—</span>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{sublabel ?? 'Not enough data'}</p>
        </div>
      </div>
    );
  }

  const clamped = Math.min(Math.max(value, 0), maxValue);
  const data = [
    { value: clamped },
    { value: maxValue - clamped },
  ];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <PieChart width={size} height={size}>
          <Pie
            data={data}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            startAngle={90}
            endAngle={-270}
            strokeWidth={0}
          >
            <Cell fill={color} />
            <Cell fill="hsl(var(--muted))" />
          </Pie>
        </PieChart>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {Icon && <Icon className="h-4 w-4 mb-1" style={{ color }} />}
          <span className="text-2xl font-bold">{Math.round(clamped)}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium">{label}</p>
        {sublabel && (
          <p className="text-xs text-muted-foreground">{sublabel}</p>
        )}
      </div>
    </div>
  );
}
