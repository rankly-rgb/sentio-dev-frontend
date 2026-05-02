import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';
import type { BenchmarkResponse } from '@/lib/types/benchmark';

export async function getBenchmarkData(): Promise<BenchmarkResponse> {
  const res = await fetchWithUserJwt<{ data: BenchmarkResponse }>('dashboard-api/benchmarks');
  return res.data;
}
