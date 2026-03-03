import { useRef, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { invokeWithServiceRole } from '@/lib/invokeEdgeFunction';

export function useManualSync() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userRef = useRef(user);
  userRef.current = user;

  const syncMutation = useMutation({
    mutationFn: async (syncType: 'incremental' | 'full_sync') => {
      const orgId = userRef.current?.organization_id;
      if (!orgId) throw new Error('Utilisateur non connecté');
      await invokeWithServiceRole('sync-stripe', {
        organization_id: orgId,
        sync_type: syncType,
        is_manual: true,
      });
    },
    onSuccess: () => {
      toast.success('Synchronisation Stripe déclenchée');
      queryClient.invalidateQueries({ queryKey: ['syncs'] });
      queryClient.invalidateQueries({ queryKey: ['sync-status'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : 'Erreur inconnue';
      toast.error('Échec sync Stripe : ' + msg);
    },
  });

  const scoresMutation = useMutation({
    mutationFn: async () => {
      const orgId = userRef.current?.organization_id;
      if (!orgId) throw new Error('Utilisateur non connecté');
      await invokeWithServiceRole('calculate-scores', {
        organization_id: orgId,
      });
    },
    onSuccess: () => {
      toast.success('Scores recalculés avec succès');
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['segments'] });
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : 'Erreur inconnue';
      toast.error('Échec recalcul scores : ' + msg);
    },
  });

  const triggerStripeSync = useCallback(
    (syncType: 'incremental' | 'full_sync' = 'incremental') => syncMutation.mutateAsync(syncType),
    [syncMutation],
  );

  const calculateScores = useCallback(
    () => scoresMutation.mutateAsync(),
    [scoresMutation],
  );

  const triggerSync = useCallback(() => triggerStripeSync('incremental'), [triggerStripeSync]);

  return {
    triggerSync,
    triggerStripeSync,
    calculateScores,
    isSyncing: syncMutation.isPending,
    isCalculating: scoresMutation.isPending,
  };
}
