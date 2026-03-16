import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';
import type { BenchmarkResponse } from '@/lib/types/benchmark';

export async function getBenchmarkData(): Promise<BenchmarkResponse> {
  return fetchWithUserJwt<BenchmarkResponse>('get-benchmark-data');
}
