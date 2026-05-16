import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';
import type {
  OnboardingStatusV2,
  AccountsSummaryCount,
  AccountsSummaryRisk,
  OrgPreferences,
  SaveOrgPreferencesResponse,
  CreateOrganizationResponse,
  UpdateOnboardingStepResponse,
  OnboardingStep,
} from '@/lib/types/onboarding-v2';

export const ONBOARDING_V2_KEY = 'onboarding-status-v2';

export function useOnboardingStatusV2() {
  const { user } = useAuth();
  return useQuery<OnboardingStatusV2>({
    queryKey: [ONBOARDING_V2_KEY, user?.organization_id],
    queryFn: () => fetchWithUserJwt<OnboardingStatusV2>('get-onboarding-status-v2'),
    enabled: !!user?.organization_id,
    staleTime: 0,
    retry: false,
  });
}

export function useUpdateOnboardingStep() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (step: OnboardingStep) =>
      fetchWithUserJwt<UpdateOnboardingStepResponse>('update-onboarding-step', {
        method: 'POST',
        body: { step },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ONBOARDING_V2_KEY, user?.organization_id] });
    },
    retry: false,
  });
}

export function useAccountsSummaryCount() {
  const { user } = useAuth();
  return useQuery<AccountsSummaryCount>({
    queryKey: ['accounts-summary-count', user?.organization_id],
    queryFn: () => fetchWithUserJwt<AccountsSummaryCount>('get-accounts-summary?mode=count'),
    enabled: !!user?.organization_id,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useAccountsSummaryRisk() {
  const { user } = useAuth();
  return useQuery<AccountsSummaryRisk>({
    queryKey: ['accounts-summary-risk', user?.organization_id],
    queryFn: () => fetchWithUserJwt<AccountsSummaryRisk>('get-accounts-summary?mode=risk'),
    enabled: false,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useSaveOrgPreferences() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (prefs: OrgPreferences) =>
      fetchWithUserJwt<SaveOrgPreferencesResponse>('save-org-preferences', {
        method: 'POST',
        body: prefs,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ONBOARDING_V2_KEY, user?.organization_id] });
    },
    retry: false,
  });
}

export function useCreateOrganization() {
  return useMutation({
    mutationFn: ({
      user_id,
      email,
      company_name,
      access_token,
      locale,
    }: {
      user_id: string;
      email: string;
      company_name: string;
      access_token: string;
      locale?: 'fr' | 'en';
    }) => {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
      return fetch(`${SUPABASE_URL}/functions/v1/create-organization-with-invitation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify({ user_id, email, company_name, locale: locale ?? 'fr' }),
      }).then(async (res) => {
        const data: CreateOrganizationResponse & { error?: string } = await res.json();
        if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
        return data as CreateOrganizationResponse;
      });
    },
    retry: false,
  });
}
