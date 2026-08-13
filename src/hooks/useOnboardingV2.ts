// STAGED FOR V2, NOT DEAD CODE — see commit c74199b ("feat(v1): nettoyer
// sidebar et bannière setup", 2026-06-06): "Code conservé intégralement,
// commenté pour réactivation V2." useOnboardingGuard/useUpdateOnboardingStep
// and the 'revelation'/'invested' steps below back Revelation.tsx/Invested.tsx
// — currently unreachable from the live signup chain (Signup -> Promise ->
// StripeConnect -> ... -> Done, which runs entirely on useOnboardingWizard.ts,
// a separate, newer hook file — don't confuse the two) because
// onboarding_completed isn't reliable yet for existing customers (see
// Dashboard.tsx's commented-out SetupWidget for the same reason). Two exports
// here ARE live today regardless: useCreateOrganization and useOnUserSignup,
// used directly by Signup.tsx.
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

const STEP_TO_PATH: Record<OnboardingStep, string> = {
  promise: '/onboarding/promise',
  stripe: '/onboarding/stripe',
  revelation: '/onboarding/revelation',
  invested: '/onboarding/invested',
  hubspot: '/onboarding/hubspot',
  completed: '/dashboard',
};

/** Vérifie l'étape courante et redirige si nécessaire. */
export function useOnboardingGuard(expectedStep: OnboardingStep) {
  const { data: status, isLoading } = useOnboardingStatusV2();
  const navigate = useNavigate();

  useEffect(() => {
    if (!status) return;
    if (status.onboarding_completed) {
      navigate('/dashboard', { replace: true });
      return;
    }
    if (status.onboarding_step !== expectedStep) {
      navigate(STEP_TO_PATH[status.onboarding_step], { replace: true });
    }
  }, [status, expectedStep, navigate]);

  return { isGuarding: isLoading, status };
}

export function useOnUserSignup() {
  return useMutation({
    mutationFn: () => fetchWithUserJwt<{ success: boolean }>('on-user-signup', { method: 'POST', body: {} }),
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
        body: JSON.stringify({ user_id, email, company_name, locale: locale ?? 'en' }),
      }).then(async (res) => {
        const data: CreateOrganizationResponse & { error?: string } = await res.json();
        if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
        return data as CreateOrganizationResponse;
      });
    },
    retry: false,
  });
}
