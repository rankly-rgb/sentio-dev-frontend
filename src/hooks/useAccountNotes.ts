import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { AccountNote } from '@/lib/types/account-notes';

const PAGE_SIZE = 10;

export function useAccountNotes(accountId: string | undefined, page = 1) {
  const { user } = useAuth();

  return useQuery<{ data: AccountNote[]; hasMore: boolean }>({
    queryKey: ['account-notes', accountId, page],
    queryFn: async () => {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE;

      const { data, error } = await supabase
        .from('account_notes')
        .select('id, title, body, note_type, source, playbook_id, execution_id, created_at, updated_at, account_id, organization_id')
        .eq('account_id', accountId!)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const notes = data ?? [];
      // We fetch PAGE_SIZE + 1 to know if there's more
      const hasMore = notes.length > PAGE_SIZE;

      return {
        data: hasMore ? notes.slice(0, PAGE_SIZE) : notes,
        hasMore,
      };
    },
    enabled: !!accountId && !!user?.organization_id,
    staleTime: 60_000,
  });
}
