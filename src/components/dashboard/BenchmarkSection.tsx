import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useT } from '@/lib/i18n/useT';
import type { BenchmarkResponse, BenchmarkMetricKey, BenchmarkRating, MetricBenchmark, BenchmarkPeers, PeerPercentiles } from '@/lib/types/benchmark';

const RATING_CLASSES: Record<BenchmarkRating, string> = {
  excellent: 'bg-emerald-100 text-emerald-700',
  bon: 'bg-blue-100 text-blue-700',
  correct: 'bg-amber-100 text-amber-700',
  mediocre: 'bg-red-100 text-red-700',
};

// --- Cursor position calculation ---
// The bar has 4 equal zones (each 25%).
// Sorted-ascending thresholds [low, mid, high] anchor positions 25%, 50%, 75%.
// Works for both higher_is_better=true and false because:
//   - HiB=true (NRR): sorted=[correct, bon, excellent], left=médiocre, right=excellent
//   - HiB=false (churn): sorted=[excellent, bon, correct], left=excellent, right=médiocre
// In both cases position increases with value, and the colored zones are reversed visually.

function computeCursorPosition(
  value: number,
  thresholds: { excellent: number; bon: number; correct: number },
): number {
  const sorted = [thresholds.correct, thresholds.bon, thresholds.excellent].sort((a, b) => a - b);
  const [low, mid, high] = sorted as [number, number, number];
  const gapLow = mid - low || 1;
  const gapHigh = high - mid || 1;

  let pos: number;
  if (value <= low) {
    pos = 25 - ((low - value) / gapLow) * 25;
  } else if (value <= mid) {
    pos = 25 + ((value - low) / gapLow) * 25;
  } else if (value <= high) {
    pos = 50 + ((value - mid) / gapHigh) * 25;
  } else {
    pos = 75 + ((value - high) / gapHigh) * 25;
  }

  return Math.min(Math.max(pos, 0), 100);
}

// --- Range bar ---

function RangeBar({ benchmark }: { benchmark: MetricBenchmark }) {
  const fr = useT();
  const { value, thresholds, higher_is_better } = benchmark;
  if (value === null) return null;

  const cursorPos = computeCursorPosition(value, thresholds);

  // HiB=true: left=médiocre(red) → excellent(green)
  // HiB=false: left=excellent(green) → médiocre(red)
  const colors = higher_is_better
    ? ['bg-red-400', 'bg-amber-400', 'bg-blue-400', 'bg-emerald-400']
    : ['bg-emerald-400', 'bg-blue-400', 'bg-amber-400', 'bg-red-400'];

  const labels = higher_is_better
    ? [fr.benchmark.mediocre, fr.benchmark.correct, fr.benchmark.bon, fr.benchmark.excellent]
    : [fr.benchmark.excellent, fr.benchmark.bon, fr.benchmark.correct, fr.benchmark.mediocre];

  return (
    <div className="space-y-1">
      <div className="relative h-3 rounded-full overflow-hidden flex">
        {colors.map((color, i) => (
          <div key={i} className={`flex-1 ${color}`} />
        ))}
        <div
          className="absolute top-1/2 w-3 h-3 rounded-full bg-foreground border-2 border-background shadow-sm"
          style={{ left: `${cursorPos}%`, transform: 'translate(-50%, -50%)' }}
          aria-label={`Position : ${value}`}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        {labels.map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>
    </div>
  );
}

// --- Peer comparison ---

function peerPositionLabel(value: number, percentiles: PeerPercentiles, higherIsBetter: boolean, fr: ReturnType<typeof useT>): string {
  const { p50 } = percentiles;
  const aboveMedian = value > p50;
  const atMedian = value === p50;

  if (atMedian) return fr.benchmark.atMedian;
  // For churn_rate (higherIsBetter=false), being below p50 numerically is better
  if (higherIsBetter) return aboveMedian ? fr.benchmark.aboveMedian : fr.benchmark.belowMedian;
  return aboveMedian ? fr.benchmark.belowMedian : fr.benchmark.aboveMedian;
}

function PeerComparison({
  metricKey,
  value,
  higherIsBetter,
  peers,
}: {
  metricKey: BenchmarkMetricKey;
  value: number | null;
  higherIsBetter: boolean;
  peers: BenchmarkPeers;
}) {
  const fr = useT();
  if (!peers.available) {
    return (
      <p className="text-xs text-muted-foreground italic">
        {fr.benchmark.peerUnavailable(peers.min_orgs_required)}
      </p>
    );
  }

  const percentiles = peers[metricKey];
  const { p25, p50, p75 } = percentiles;
  const positionLabel = value !== null ? peerPositionLabel(value, percentiles, higherIsBetter, fr) : '—';

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-foreground">{positionLabel}</p>
      <div className="flex items-end justify-between text-[10px] text-muted-foreground gap-1">
        <span>p25 : {p25}</span>
        <span className="font-medium text-foreground">
          {fr.benchmark.peerMedian} : {p50}
        </span>
        <span>p75 : {p75}</span>
      </div>
      <p className="text-[10px] text-muted-foreground">{fr.benchmark.orgs(peers.org_count)}</p>
    </div>
  );
}

// --- Metric card ---

function BenchmarkCard({
  metricKey,
  benchmark,
  peers,
}: {
  metricKey: BenchmarkMetricKey;
  benchmark: MetricBenchmark;
  peers: BenchmarkPeers;
}) {
  const fr = useT();
  const RATING_LABELS: Record<BenchmarkRating, string> = {
    excellent: fr.benchmark.excellent,
    bon: fr.benchmark.bon,
    correct: fr.benchmark.correct,
    mediocre: fr.benchmark.mediocre,
  };
  const METRIC_CONFIG: Record<BenchmarkMetricKey, { label: string; formatValue: (v: number) => string }> = {
    nrr: {
      label: fr.benchmark.nrr,
      formatValue: (v) => `${v.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`,
    },
    churn_rate: {
      label: fr.benchmark.churnRate,
      formatValue: (v) => `${v.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`,
    },
    mrr_growth: {
      label: fr.benchmark.mrrGrowth,
      formatValue: (v) =>
        `${v > 0 ? '+' : ''}${v.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`,
    },
  };
  const config = METRIC_CONFIG[metricKey];
  const { value, rating, sources, higher_is_better } = benchmark;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{config.label}</CardTitle>
          {rating && (
            <Badge className={`${RATING_CLASSES[rating]} border-0`}>{RATING_LABELS[rating]}</Badge>
          )}
        </div>
        <p className="text-2xl font-bold">{value !== null ? config.formatValue(value) : '—'}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sector benchmark */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{fr.benchmark.sectorBenchmark}</p>
          {value !== null ? (
            <RangeBar benchmark={benchmark} />
          ) : (
            <p className="text-xs text-muted-foreground">—</p>
          )}
          {sources.length > 0 && (
            <p className="text-[10px] text-muted-foreground italic">
              {fr.benchmark.sources} : {sources.join(', ')}
            </p>
          )}
        </div>

        {/* Peer comparison */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{fr.benchmark.peerComparison}</p>
          <PeerComparison
            metricKey={metricKey}
            value={value}
            higherIsBetter={higher_is_better}
            peers={peers}
          />
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
  const fr = useT();
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
          <BenchmarkCard key={key} metricKey={key} benchmark={data[key]} peers={data.peers} />
        ))}
      </div>
    </div>
  );
}
