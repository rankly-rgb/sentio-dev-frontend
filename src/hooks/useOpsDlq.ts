import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useT } from '@/lib/i18n/useT';
import type { WebhookDeadLetter, DlqFilters } from '@/types/ops';

const PAGE_SIZE = 20;

async function fetchDlq(
  filters: DlqFilters,
): Promise<{ data: WebhookDeadLetter[]; count: number }> {
  const from = (filters.page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('webhook_dead_letter')
    .select('*', { count: 'exact' })
    .is('resolved_at', null)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (filters.provider !== 'all') {
    query = query.eq('provider', filters.provider);
  }
  if (filters.event_type !== 'all') {
    query = query.eq('event_type', filters.event_type);
  }
  if (filters.date_from) {
    query = query.gte('created_at', filters.date_from);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data || [], count: count || 0 };
}

export function useOpsDlq(filters: DlqFilters) {
  const fr = useT();
  const qc = useQueryClient();

  const dlqQuery = useQuery({
    queryKey: ['ops', 'dlq', filters],
    queryFn: () => fetchDlq(filters),
    staleTime: 60_000,
  });

  const markResolved = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('webhook_dead_letter')
        .update({ resolved_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(fr.ops.dlqResolved);
      qc.invalidateQueries({ queryKey: ['ops', 'dlq'] });
    },
    onError: (error: Error) => {
      toast.error(fr.ops.dlqResolveError + ' : ' + error.message);
    },
  });

  return {
    dlqEntries: dlqQuery.data?.data ?? [],
    totalCount: dlqQuery.data?.count ?? 0,
    isLoading: dlqQuery.isLoading,
    error: dlqQuery.error,
    refetch: dlqQuery.refetch,
    markResolved,
    pageSize: PAGE_SIZE,
  };
}
