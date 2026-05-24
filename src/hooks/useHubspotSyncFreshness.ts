import { useQuery } from '@tanstack/react-query';
import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';
import type { HealthCheckResponse } from '@/types/ops';

/**
 * Lightweight hook to get HubSpot sync freshness from the health-check endpoint.
 * Returns hubspot_stale and last_hubspot_sync_hours_ago.
 */
export function useHubspotSyncFreshness() {
  const query = useQuery<HealthCheckResponse>({
    queryKey: ['hubspot-sync-freshness'],
    queryFn: () =>
      fetchWithUserJwt<HealthCheckResponse>('health-check', { method: 'GET' }),
    staleTime: 60_000,
    refetchIntervalInBackground: false,
  });

  return {
    hubspotStale: query.data?.hubspot_stale ?? null,
    lastHubspotSyncHoursAgo: query.data?.last_hubspot_sync_hours_ago ?? null,
    isLoading: query.isLoading,
  };
}
