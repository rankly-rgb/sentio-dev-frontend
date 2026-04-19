import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';

export interface WeeklyWin {
  account_id: string;
  stripe_customer_id: string;
  display_name: string | null;
  health_score_7d_ago: number;
  health_score_now: number;
  health_delta: number;
  main_dimension: string;
  segment_before: string | null;
  segment_now: string | null;
}

interface WeeklyWinsResponse {
  data: WeeklyWin[];
}

export function useWeeklyWins() {
  const { user } = useAuth();

  return useQuery<WeeklyWin[]>({
    queryKey: ['weekly-wins', user?.organization_id],
    queryFn: async () => {
      const res = await fetchWithUserJwt<WeeklyWinsResponse>('dashboard-api/wins');
      return res.data;
    },
    enabled: !!user?.organization_id,
    staleTime: 5 * 60_000,
    retry: false,
  });
}
