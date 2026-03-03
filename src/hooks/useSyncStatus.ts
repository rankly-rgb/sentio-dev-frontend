import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { DataSync } from '@/types/database';

export function useSyncStatus() {
  return useQuery({
    queryKey: ['sync-status'],
    queryFn: async (): Promise<DataSync[]> => {
      const { data, error } = await supabase
        .from('data_syncs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
  });
}
