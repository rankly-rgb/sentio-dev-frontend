import { useT } from '@/lib/i18n/useT';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import type { ScoreHistoryItem } from '@/lib/types/accounts';

interface Props {
  scoreHistory: ScoreHistoryItem[];
}

function formatChartData(history: ScoreHistoryItem[]) {
  return [...history]
    .sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date))
    .map((h) => ({
      date: h.snapshot_date.slice(5),
      Health: h.health_score,
      Churn: h.churn_risk_score,
      Expansion: h.expansion_score,
    }));
}

export default function AccountScoreHistory({ scoreHistory }: Props) {
  const fr = useT();
  if (scoreHistory.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-4">
        History available after the first score calculation
      </p>
    );
  }

  const chartData = formatChartData(scoreHistory);

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-2">
        {fr.accountDetail.scoreEvolution} (30d)
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
          <RechartsTooltip
            contentStyle={{ fontSize: 11, borderRadius: 8 }}
            formatter={(v: number | string) => [
              typeof v === 'number' ? `${Math.round(v)}/100` : '—',
            ]}
          />
          <Line
            type="monotone"
            dataKey="Health"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="Churn"
            stroke="hsl(var(--destructive))"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="Expansion"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
