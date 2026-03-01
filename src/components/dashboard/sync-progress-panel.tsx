import { useSyncStatus } from '@/hooks/useSyncStatus';
import { useManualSync } from '@/hooks/useManualSync';
import { fr } from '@/i18n/fr';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';

export function SyncProgressPanel() {
  const { data: syncs } = useSyncStatus();
  const { triggerSync, isSyncing } = useManualSync();

  const lastSync = syncs?.[0];

  return (
    <div className="flex items-center gap-3">
      {lastSync && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{fr.dashboard.lastSync} :</span>
          <Badge variant={lastSync.sync_status === 'completed' ? 'default' : 'destructive'}>
            {lastSync.sync_source} — {lastSync.sync_status}
          </Badge>
        </div>
      )}
      <Button variant="outline" size="sm" onClick={triggerSync} disabled={isSyncing}>
        <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
        {isSyncing ? fr.dashboard.syncInProgress : fr.dashboard.manualRefresh}
      </Button>
    </div>
  );
}
