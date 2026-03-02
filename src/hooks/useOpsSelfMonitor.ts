import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { invokeWithServiceRole } from '@/lib/invokeEdgeFunction';
import { fr } from '@/i18n/fr';
import type { SelfMonitorResponse } from '@/types/ops';

export function useOpsSelfMonitor() {
  const qc = useQueryClient();

  return useMutation<SelfMonitorResponse>({
    mutationFn: () =>
      invokeWithServiceRole<SelfMonitorResponse>('self-monitor'),
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
