import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';
import { useT } from '@/lib/i18n/useT';
import type { SelfMonitorResponse } from '@/types/ops';

export function useOpsSelfMonitor() {
  const fr = useT();
  const qc = useQueryClient();

  return useMutation<SelfMonitorResponse>({
    mutationFn: () =>
      fetchWithUserJwt<SelfMonitorResponse>('self-monitor', { method: 'POST' }),
    onSuccess: (data) => {
      toast.success(
        fr.ops.selfMonitorSuccess.replace('{count}', String(data.actions_taken)),
      );
      qc.invalidateQueries({ queryKey: ['ops'] });
    },
    onError: (error: Error) => {
      toast.error(fr.ops.selfMonitorError + ' : ' + error.message);
    },
  });
}
