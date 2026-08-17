import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';
import type { OnboardingFlowStatus, OnboardingFirstWin, IntegrationsConfigStatus } from '@/lib/types/onboarding-flow';

const QUERY_KEY = 'onboarding-flow-status';

export function useOnboardingFlowStatus() {
  const { user } = useAuth();

  return useQuery<OnboardingFlowStatus>({
    queryKey: [QUERY_KEY, user?.organization_id],
    // Backend wraps every response as {data: ...} (see jsonResponse,
    // _shared/supabase-client.ts) — same pattern already unwrapped correctly
    // by useIntegrationsConfig below and benchmark-queries.ts. Left flat here
    // previously, so every field read off this hook was silently `undefined`.
    queryFn: () => fetchWithUserJwt<{ data: OnboardingFlowStatus }>('onboarding-status').then((res) => res.data),
    enabled: !!user?.organization_id,
    staleTime: 0,
    retry: false,
  });
}

export function useOnboardingFirstWin() {
  const { user } = useAuth();

  return useQuery<OnboardingFirstWin>({
    queryKey: ['onboarding-first-win', user?.organization_id],
    queryFn: () => fetchWithUserJwt<{ data: OnboardingFirstWin }>('onboarding-first-win').then((res) => res.data),
    enabled: !!user?.organization_id,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useConnectStripe() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (apiKey: string) =>
      fetchWithUserJwt('stripe-connect', { method: 'POST', body: { api_key: apiKey } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, user?.organization_id] });
    },
    retry: false,
  });
}

export function useIntegrationsConfig() {
  const { user } = useAuth();

  return useQuery<{ data: IntegrationsConfigStatus }>({
    queryKey: ['integrations-config', user?.organization_id],
    queryFn: () => fetchWithUserJwt<{ data: IntegrationsConfigStatus }>('integrations-config'),
    enabled: !!user?.organization_id,
    staleTime: 60_000,
    retry: false,
  });
}

export function useSaveIntegrationsConfig() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ provider, api_key }: { provider: 'stripe' | 'hubspot'; api_key: string }) =>
      fetchWithUserJwt<{ success: boolean }>('integrations-config', {
        method: 'POST',
        body: { provider, api_key },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations-config', user?.organization_id] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, user?.organization_id] });
    },
    retry: false,
  });
}

export function useMarkOnboardingField() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (field: 'first_win_seen' | 'onboarding_completed') =>
      fetchWithUserJwt('onboarding-status', {
        method: 'PATCH',
        body: { field, value: true },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, user?.organization_id] });
    },
    retry: false,
  });
}
