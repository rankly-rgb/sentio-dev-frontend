import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { fetchMrrTrend } from '@/lib/queries/mrr';
import { useT } from '@/lib/i18n/useT';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { MrrTrendPoint, MrrTrendSummary } from '@/types/dashboard';

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' });
}

function formatDateFull(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatMrrEur(cents: number): string {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

function computeSummary(points: MrrTrendPoint[]): MrrTrendSummary | null {
  if (points.length === 0) return null;
  const start = points[0].total_mrr_cents;
  const end = points[points.length - 1].total_mrr_cents;
  const delta = end - start;
  const deltaPct = start > 0 ? Math.round((delta / start) * 10000) / 100 : null;
  return { start, end, delta, deltaPct };
}

function getDateRange(days: number): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

interface ChartPoint {
  date: string;
  dateLabel: string;
  mrr_eur: number;
  mrr_cents: number;
  account_count: number;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartPoint }> }) {
  const fr = useT();
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md text-sm">
      <p className="font-medium">{formatDateFull(point.date)}</p>
      <p className="text-indigo-600 font-semibold">{formatMrrEur(point.mrr_cents)}</p>
      <p className="text-muted-foreground">{point.account_count} {fr.mrr.accounts}</p>
    </div>
  );
}

export function MrrChart() {
  const fr = useT();
  const PERIODS = [
    { label: fr.mrr.period7d, days: 7 },
    { label: fr.mrr.period30d, days: 30 },
    { label: fr.mrr.period90d, days: 90 },
  ] as const;
  const [periodDays, setPeriodDays] = useState(30);

  const { startDate, endDate } = useMemo(() => getDateRange(periodDays), [periodDays]);

  const { data: trend, isLoading } = useQuery({
    queryKey: ['mrr', 'trend', startDate, endDate],
    queryFn: () => fetchMrrTrend(startDate, endDate),
    staleTime: 300_000,
  });

  const summary = useMemo(() => computeSummary(trend || []), [trend]);

  const chartData: ChartPoint[] = useMemo(
    () =>
      (trend || []).map(p => ({
        date: p.snapshot_date,
        dateLabel: formatDateShort(p.snapshot_date),
        mrr_eur: p.total_mrr_cents / 100,
        mrr_cents: p.total_mrr_cents,
        account_count: p.account_count,
      })),
    [trend],
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle>{fr.mrr.trend}</CardTitle>
          <div className="flex items-center gap-1">
            {PERIODS.map(p => (
              <Button
                key={p.days}
                variant={periodDays === p.days ? 'default' : 'outline'}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => setPeriodDays(p.days)}
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : !trend || trend.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center text-muted-foreground gap-2 px-4">
            <p>{fr.mrr.emptyState}</p>
            <Link to="/settings/integrations" className="text-sm text-primary hover:underline">
              {fr.nav.settings}
            </Link>
          </div>
        ) : (
          <>
            {/* Summary banner */}
            {summary && (
              <div className="flex items-center gap-6 mb-4 flex-wrap">
                <div>
                  <p className="text-xs text-muted-foreground">{fr.mrr.currentMrr}</p>
                  <p className="text-2xl font-bold">{formatMrrEur(summary.end)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{fr.mrr.delta}</p>
                  <div className="flex items-center gap-1">
                    {summary.delta >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    )}
                    <span className={`text-lg font-semibold ${summary.delta >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                      {summary.delta >= 0 ? '+' : ''}{formatMrrEur(summary.delta)}
                    </span>
                    {summary.deltaPct !== null && (
                      <span className={`text-sm ${summary.delta >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                        ({summary.delta >= 0 ? '+' : ''}{summary.deltaPct.toFixed(1)} %)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `${Math.round(v).toLocaleString('en-US')} €`}
                    className="text-muted-foreground"
                    width={80}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="mrr_eur"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#mrrGradient)"
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2, fill: 'hsl(var(--primary))' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
