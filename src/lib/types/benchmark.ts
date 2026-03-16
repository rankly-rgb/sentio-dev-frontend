export type BenchmarkRating = 'excellent' | 'bon' | 'correct' | 'médiocre';

export interface MetricBenchmark {
  value: number;
  external_benchmark: {
    excellent: number;
    bon: number;
    correct: number;
    mediocre: number;
    rating: BenchmarkRating;
    sources: string[];
  };
  peer: {
    available: boolean;
    median: number | null;
    org_count: number | null;
    delta: number | null;
  };
}

export interface BenchmarkResponse {
  computed_at: string;
  period_days: number;
  metrics: {
    nrr: MetricBenchmark;
    churn_rate: MetricBenchmark;
    mrr_growth: MetricBenchmark;
  };
}

export type BenchmarkMetricKey = keyof BenchmarkResponse['metrics'];

/**
 * Returns true when a positive delta is favorable for the given metric.
 * For churn_rate, lower is better — so a negative delta (churning less than peers) is green.
 */
export function isPositiveDelta(metric: BenchmarkMetricKey, delta: number): boolean {
  if (metric === 'churn_rate') return delta < 0;
  return delta > 0;
}
