import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { invokeWithServiceRole } from '@/lib/invokeEdgeFunction';

export function useManualSync() {
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const triggerStripeSync = async (syncType: 'incremental' | 'full_sync' = 'incremental') => {
    setIsSyncing(true);
    try {
      await invokeWithServiceRole('sync-stripe', {
        organization_id: user?.organization_id,
        sync_type: syncType,
        is_manual: true,
      });
      toast.success('Synchronisation Stripe déclenchée');
      window.dispatchEvent(new CustomEvent('manual-sync-complete'));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur inconnue';
      toast.error('Échec sync Stripe : ' + msg);
    } finally {
      setIsSyncing(false);
    }
  };

  const calculateScores = async () => {
    setIsCalculating(true);
    try {
      await invokeWithServiceRole('calculate-scores', {
        organization_id: user?.organization_id,
      });
      toast.success('Scores recalculés avec succès');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur inconnue';
      toast.error('Échec recalcul scores : ' + msg);
    } finally {
      setIsCalculating(false);
    }
  };

  // Compatibilité ascendante
  const triggerSync = () => triggerStripeSync('incremental');

  return { triggerSync, triggerStripeSync, calculateScores, isSyncing, isCalculating };
}
