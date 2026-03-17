import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { fr } from '@/i18n/fr';
import type { BenchmarkResponse, BenchmarkMetricKey, BenchmarkRating, MetricBenchmark } from '@/lib/types/benchmark';
import { isPositiveDelta } from '@/lib/types/benchmark';

// --- Rating badge colors (Tailwind classes matching project palette) ---

const RATING_CLASSES: Record<BenchmarkRating, string> = {
  excellent: 'bg-emerald-100 text-emerald-700',
  bon: 'bg-blue-100 text-blue-700',
  correct: 'bg-amber-100 text-amber-700',
  'médiocre': 'bg-red-100 text-red-700',
};

const RATING_LABELS: Record<BenchmarkRating, string> = {
  excellent: fr.benchmark.excellent,
  bon: fr.benchmark.bon,
  correct: fr.benchmark.correct,
  'médiocre': fr.benchmark.mediocre,
};

// --- Metric display config ---

const METRIC_CONFIG: Record<BenchmarkMetricKey, { label: string; formatValue: (v: number) => string }> = {
  nrr: {
    label: fr.benchmark.nrr,
    formatValue: (v) => `${v.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}\u00A0%`,
  },
  churn_rate: {
    label: fr.benchmark.churnRate,
    formatValue: (v) => `${v.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}\u00A0%`,
  },
  mrr_growth: {
    label: fr.benchmark.mrrGrowth,
    formatValue: (v) => `${v > 0 ? '+' : ''}${v.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}\u00A0%`,
  },
};

// --- Range bar component ---

function RangeBar({ metric, benchmark }: { metric: BenchmarkMetricKey; benchmark: MetricBenchmark }) {
  const ext = benchmark.external_benchmark;

  // For churn_rate the scale is inverted (lower = better, right side is excellent)
  const isInverted = metric === 'churn_rate';

  // Build ordered threshold values from left to right
  const thresholds = isInverted
    ? [ext.mediocre, ext.correct, ext.bon, ext.excellent]
    : [ext.mediocre, ext.correct, ext.bon, ext.excellent];

  // Compute min/max with some padding
  const allValues = [...thresholds, benchmark.value];
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = max - min || 1;
  const pad = range * 0.1;
  const scaleMin = min - pad;
  const scaleMax = max + pad;
  const scaleRange = scaleMax - scaleMin;

  const toPercent = (v: number) => ((v - scaleMin) / scaleRange) * 100;

  const segmentColors = isInverted
    ? ['bg-emerald-400', 'bg-blue-400', 'bg-amber-400', 'bg-red-400']
    : ['bg-red-400', 'bg-amber-400', 'bg-blue-400', 'bg-emerald-400'];

  const labels = isInverted
    ? [fr.benchmark.excellent, fr.benchmark.bon, fr.benchmark.correct, fr.benchmark.mediocre]
    : [fr.benchmark.mediocre, fr.benchmark.correct, fr.benchmark.bon, fr.benchmark.excellent];

  // Sort thresholds for segment boundaries
  const sorted = [...thresholds].sort((a, b) => a - b);

  return (
    <div className="space-y-1">
      {/* Bar */}
      <div className="relative h-3 rounded-full bg-muted overflow-hidden">
        {sorted.map((threshold, i) => {
          const start = i === 0 ? 0 : toPercent(sorted[i - 1]);
          const end = toPercent(threshold);
          return (
            <div
              key={i}
              className={`absolute top-0 h-full ${segmentColors[i]}`}
              style={{ left: `${start}%`, width: `${Math.max(end - start, 0)}%` }}
            />
          );
        })}
        {/* Last segment to 100% */}
        <div
          className={`absolute top-0 h-full ${segmentColors[segmentColors.length - 1]}`}
          style={{ left: `${toPercent(sorted[sorted.length - 1])}%`, width: `${100 - toPercent(sorted[sorted.length - 1])}%` }}
        />
        {/* Org position indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-foreground border-2 border-background shadow-sm"
          style={{ left: `${Math.min(Math.max(toPercent(benchmark.value), 2), 98)}%`, transform: 'translate(-50%, -50%)' }}
          aria-label={`Position : ${benchmark.value}`}
        />
      </div>
      {/* Labels */}
      <div className="flex justify-between text-[10px] text-muted-foreground">
        {labels.map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>
    </div>
  );
}

// --- Peer comparison section ---

function PeerSection({ metric, peer }: { metric: BenchmarkMetricKey; peer: MetricBenchmark['peer'] }) {
  if (!peer.available) {
    return <p className="text-xs text-muted-foreground italic">{fr.benchmark.peerUnavailable}</p>;
  }

  const deltaValue = peer.delta ?? 0;
  const positive = isPositiveDelta(metric, deltaValue);
  const deltaFormatted = `${deltaValue > 0 ? '+' : ''}${deltaValue.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}\u00A0%`;

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">
        {fr.benchmark.peerMedian} : {peer.median != null ? `${peer.median.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}\u00A0%` : '—'}
        {peer.org_count != null && (
          <span className="ml-1 text-xs">({fr.benchmark.orgs(peer.org_count)})</span>
        )}
      </span>
      <span className={positive ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>
        {fr.benchmark.vsPeers(deltaFormatted)}
      </span>
    </div>
  );
}

// --- Metric card ---

function BenchmarkCard({ metricKey, benchmark }: { metricKey: BenchmarkMetricKey; benchmark: MetricBenchmark }) {
  const config = METRIC_CONFIG[metricKey];
  const rating = benchmark.external_benchmark.rating;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{config.label}</CardTitle>
          <Badge className={`${RATING_CLASSES[rating]} border-0`}>
            {RATING_LABELS[rating]}
          </Badge>
        </div>
        <p className="text-2xl font-bold">{config.formatValue(benchmark.value)}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sector benchmark */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{fr.benchmark.sectorBenchmark}</p>
          <RangeBar metric={metricKey} benchmark={benchmark} />
          {benchmark.external_benchmark.sources.length > 0 && (
            <p className="text-[10px] text-muted-foreground">
              {fr.benchmark.sources} : {benchmark.external_benchmark.sources.join(', ')}
            </p>
          )}
        </div>

        {/* Peer comparison */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{fr.benchmark.peerComparison}</p>
          <PeerSection metric={metricKey} peer={benchmark.peer} />
        </div>
      </CardContent>
    </Card>
  );
}

// --- Skeleton ---

function BenchmarkSkeleton() {
  return (
    <div className="space-y-4">
      <div>
        <Skeleton className="h-6 w-48 mb-1" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-8 w-20 mt-1" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-full rounded-full" />
                <Skeleton className="h-2 w-40" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-4 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// --- Main section ---

const METRIC_ORDER: BenchmarkMetricKey[] = ['nrr', 'churn_rate', 'mrr_growth'];

interface BenchmarkSectionProps {
  data: BenchmarkResponse | null;
  isLoading?: boolean;
  error?: Error | null;
}

export function BenchmarkSection({ data, isLoading, error }: BenchmarkSectionProps) {
  if (isLoading) return <BenchmarkSkeleton />;

  if (error) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">{fr.benchmark.title}</h2>
          <p className="text-sm text-muted-foreground">{fr.benchmark.subtitle}</p>
        </div>
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-amber-800">{fr.benchmark.errorTitle}</p>
            <p className="text-xs text-amber-600 mt-1">{fr.benchmark.errorDescription}</p>
            {import.meta.env.DEV && (
              <p className="text-xs text-muted-foreground mt-2 font-mono">{error.message}</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{fr.benchmark.title}</h2>
        <p className="text-sm text-muted-foreground">{fr.benchmark.subtitle}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {METRIC_ORDER.map((key) => (
          <BenchmarkCard key={key} metricKey={key} benchmark={data.metrics[key]} />
        ))}
      </div>
    </div>
  );
}
