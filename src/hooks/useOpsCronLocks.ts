import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useT } from '@/lib/i18n/useT';
import type { CronLock } from '@/types/ops';

async function fetchCronLocks(): Promise<CronLock[]> {
  const { data, error } = await supabase
    .from('cron_locks')
    .select('*')
    .is('released_at', null)
    .order('locked_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export function useOpsCronLocks() {
  const fr = useT();
  const qc = useQueryClient();

  const locksQuery = useQuery({
    queryKey: ['ops', 'cron-locks'],
    queryFn: fetchCronLocks,
    staleTime: 60_000,
  });

  const forceRelease = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cron_locks')
        .update({ released_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(fr.ops.lockReleased);
      qc.invalidateQueries({ queryKey: ['ops', 'cron-locks'] });
    },
    onError: (error: Error) => {
      toast.error(fr.ops.lockReleaseError + ' : ' + error.message);
    },
  });

  return {
    locks: locksQuery.data ?? [],
    isLoading: locksQuery.isLoading,
    error: locksQuery.error,
    refetch: locksQuery.refetch,
    forceRelease,
  };
}
