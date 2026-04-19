import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';

export interface SuggestedPlaybookData {
  suggested_playbook_id: string | null;
  title: string;
  template_category: string;
  reason: string;
  accounts_targeted: number;
  already_active: boolean;
  segment_type: string | null;
}

interface SuggestedPlaybookResponse {
  data: SuggestedPlaybookData | null;
}

const IGNORE_KEY = 'sentio_suggested_playbook_ignored';

export function useSuggestedPlaybook() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const ignored = localStorage.getItem(IGNORE_KEY) === '1';

  const query = useQuery<SuggestedPlaybookData | null>({
    queryKey: ['suggested-playbook', user?.organization_id],
    queryFn: async () => {
      const res = await fetchWithUserJwt<SuggestedPlaybookResponse>('playbooks-suggested');
      return res.data;
    },
    enabled: !!user?.organization_id && !ignored,
    staleTime: 10 * 60_000,
    retry: false,
  });

  const ignore = () => {
    localStorage.setItem(IGNORE_KEY, '1');
    queryClient.setQueryData(['suggested-playbook', user?.organization_id], null);
  };

  return { ...query, ignore, isIgnoring: false };
}
