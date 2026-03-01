import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useManualSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const triggerSync = async () => {
    setIsSyncing(true);
    setError(null);

    try {
      const { error: fnError } = await supabase.functions.invoke('trigger-manual-sync');
      if (fnError) throw fnError;
    } catch (e: any) {
      setError(e.message || 'Échec de la synchronisation manuelle');
    } finally {
      setIsSyncing(false);
    }
  };

  return { triggerSync, isSyncing, error };
}
