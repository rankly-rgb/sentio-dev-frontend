import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getTeamMembers, getOrganizationDetails } from '@/lib/queries/settings';

export function useOrganizationSettings() {
  const { user } = useAuth();
  const orgId = user?.organization_id;

  const orgQuery = useQuery({
    queryKey: ['organization', orgId],
    queryFn: () => {
      if (!orgId) throw new Error('Missing organization_id');
      return getOrganizationDetails(orgId);
    },
    enabled: !!orgId,
    staleTime: 120_000,
  });

  const teamQuery = useQuery({
    queryKey: ['team', orgId],
    queryFn: () => {
      if (!orgId) throw new Error('Missing organization_id');
      return getTeamMembers(orgId);
    },
    enabled: !!orgId,
    staleTime: 120_000,
  });

  return {
    organization: orgQuery.data || null,
    team: teamQuery.data || [],
    isLoading: orgQuery.isLoading || teamQuery.isLoading,
    error: orgQuery.error || teamQuery.error,
    refetch: () => {
      orgQuery.refetch();
      teamQuery.refetch();
    },
  };
}
