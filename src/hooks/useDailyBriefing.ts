import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';

export interface DailyBriefing {
  portfolio: {
    health_delta_7d: number;
    health_trend: 'up' | 'down' | 'stable';
  };
  risk_accounts_7d: number;
  p0_insights_count: number;
  insight_du_jour: {
    account_id: string;
    stripe_customer_id: string;
    display_name: string | null;
    delta: number;
    direction: 'up' | 'down';
  } | null;
}

interface DailyBriefingResponse {
  data: DailyBriefing;
}

export function useDailyBriefing() {
  const { user } = useAuth();

  return useQuery<DailyBriefing>({
    queryKey: ['daily-briefing', user?.organization_id],
    queryFn: async () => {
      const res = await fetchWithUserJwt<DailyBriefingResponse>('dashboard-api/briefing');
      return res.data;
    },
    enabled: !!user?.organization_id,
    staleTime: 5 * 60_000,
    retry: false,
  });
}
