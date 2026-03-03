import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { DataSync } from '@/types/database';
import type { SyncsExtendedFilters } from '@/types/ops';

const PAGE_SIZE = 25;

async function fetchSyncsExtended(
  orgId: string,
  filters: SyncsExtendedFilters,
): Promise<{ data: DataSync[]; count: number }> {
  const from = (filters.page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('data_syncs')
    .select('*', { count: 'exact' })
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (filters.status !== 'all') {
    query = query.eq('sync_status', filters.status);
  }
  if (filters.source !== 'all') {
    query = query.eq('sync_source', filters.source);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data || [], count: count || 0 };
}

export function useOpsSyncsExtended(filters: SyncsExtendedFilters) {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['ops', 'syncs-extended', user?.organization_id, filters],
    queryFn: () => fetchSyncsExtended(user?.organization_id ?? '', filters),
    enabled: !!user?.organization_id,
    staleTime: 60_000,
  });

  return {
    syncs: query.data?.data ?? [],
    totalCount: query.data?.count ?? 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    pageSize: PAGE_SIZE,
  };
}
