import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';

export interface OnboardingStatus {
  stripe_connected: boolean;
  hubspot_connected: boolean;
  first_score_calculated: boolean;
  aha_moment_ready: boolean;
  aha_moment_seen: boolean;
  first_score_calculated_at: string | null;
  aha_moment_seen_at: string | null;
  accounts_count: number;
  top_risk_account: {
    id: string;
    stripe_customer_id: string;
    display_name: string | null;
    churn_risk_score: number;
    health_score: number;
  } | null;
}

interface OnboardingStatusResponse {
  data: OnboardingStatus;
}

export function useOnboardingStatus() {
  const { user } = useAuth();

  return useQuery<OnboardingStatus>({
    queryKey: ['onboarding-status', user?.organization_id],
    queryFn: async () => {
      const res = await fetchWithUserJwt<OnboardingStatusResponse>('onboarding-status');
      return res.data;
    },
    enabled: !!user?.organization_id,
    staleTime: 5 * 60_000,
    retry: false,
  });
}
