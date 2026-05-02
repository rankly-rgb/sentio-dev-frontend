export type BenchmarkRating = 'excellent' | 'bon' | 'correct' | 'mediocre';

export interface MetricBenchmark {
  value: number | null;
  rating: BenchmarkRating | null;
  thresholds: {
    excellent: number;
    bon: number;
    correct: number;
  };
  higher_is_better: boolean;
  sources: string[];
}

export interface PeerPercentiles {
  p25: number;
  p50: number;
  p75: number;
}

export type BenchmarkPeers =
  | { available: false; min_orgs_required: number }
  | {
      available: true;
      org_count: number;
      computed_at: string;
      nrr: PeerPercentiles;
      churn_rate: PeerPercentiles;
      mrr_growth: PeerPercentiles;
    };

export interface BenchmarkResponse {
  nrr: MetricBenchmark;
  churn_rate: MetricBenchmark;
  mrr_growth: MetricBenchmark;
  peers: BenchmarkPeers;
}

export type BenchmarkMetricKey = 'nrr' | 'churn_rate' | 'mrr_growth';
