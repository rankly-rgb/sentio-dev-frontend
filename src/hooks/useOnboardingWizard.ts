import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';
import type { OnboardingStatusResponse } from '@/lib/types/onboarding-wizard';

interface VerifyStripeTokenResponse {
  success: boolean;
  mode: 'live' | 'test';
  error?: string;
}

interface StripeOAuthInitiateResponse {
  url: string;
}

interface SyncStatusSteps {
  behavioral: boolean;
  cohorts: boolean;
  scores: boolean;
}

export interface SyncStatusResponse {
  status: 'pending' | 'running' | 'completed' | 'error';
  steps: SyncStatusSteps;
  error_message?: string;
}

export interface ChurnRiskAccount {
  masked_id: string;
  health_score: number;
  churn_risk_score: number;
}

interface TopChurnRisksResponse {
  accounts: ChurnRiskAccount[];
}

interface HubspotConnectResponse {
  success: boolean;
  error?: string;
}

interface StripeOAuthCallbackResponse {
  success: boolean;
  error?: string;
}

export function useOnboardingStatusFull(options?: { retry?: number | boolean; retryDelay?: number }) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['onboarding-status-full', user?.organization_id],
    queryFn: () => fetchWithUserJwt<OnboardingStatusResponse>('onboarding-status'),
    enabled: !!user?.organization_id,
    staleTime: 0,
    retry: false,
    ...options,
  });
}

export function useVerifyStripeToken() {
  return useMutation({
    mutationFn: (stripe_api_key: string) =>
      fetchWithUserJwt<VerifyStripeTokenResponse>('verify-stripe-token', {
        method: 'POST',
        body: { stripe_api_key },
      }),
    retry: false,
  });
}

export function useStripeOAuthInitiate() {
  return useMutation({
    mutationFn: () =>
      fetchWithUserJwt<StripeOAuthInitiateResponse>('stripe-oauth-initiate'),
    retry: false,
  });
}

export function useStripeOAuthCallback() {
  return useMutation({
    mutationFn: ({ code, state }: { code: string; state: string }) =>
      fetchWithUserJwt<StripeOAuthCallbackResponse>('stripe-oauth-callback', {
        method: 'POST',
        body: { code, state },
      }),
    retry: false,
  });
}

export function useSyncStatus(enabled: boolean) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['wizard', 'sync-status', user?.organization_id],
    queryFn: () => fetchWithUserJwt<SyncStatusResponse>('get-sync-status'),
    enabled: enabled && !!user?.organization_id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'completed' || status === 'error' ? false : 3_000;
    },
    staleTime: 0,
    gcTime: 0,
  });
}

export function useTopChurnRisks() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['wizard', 'top-churn-risks', user?.organization_id],
    queryFn: () => fetchWithUserJwt<TopChurnRisksResponse>('get-top-churn-risks'),
    enabled: !!user?.organization_id,
    staleTime: 60_000,
  });
}

export function useHubspotConnect() {
  return useMutation({
    mutationFn: (hubspot_api_key: string) =>
      fetchWithUserJwt<HubspotConnectResponse>('hubspot-connect', {
        method: 'POST',
        body: { hubspot_api_key },
      }),
    retry: false,
  });
}
