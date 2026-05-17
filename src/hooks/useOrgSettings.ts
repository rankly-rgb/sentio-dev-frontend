import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';

export interface OrgSettingsData {
  danger_threshold: number;
  at_risk_threshold: number;
  alert_channel: 'none' | 'slack' | 'email' | 'both';
}

const KEY = 'org-settings';

export function useOrgSettings() {
  const { user } = useAuth();
  return useQuery<OrgSettingsData>({
    queryKey: [KEY, user?.organization_id],
    queryFn: () => fetchWithUserJwt<OrgSettingsData>('org-settings'),
    enabled: !!user?.organization_id,
    staleTime: 60_000,
    retry: false,
  });
}

export function usePatchOrgSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (body: Partial<OrgSettingsData>) =>
      fetchWithUserJwt<OrgSettingsData>('org-settings', { method: 'PATCH', body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, user?.organization_id] });
    },
    retry: false,
  });
}
