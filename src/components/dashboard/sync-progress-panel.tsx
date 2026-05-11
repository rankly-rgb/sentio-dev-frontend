import { useSyncStatus } from '@/hooks/useSyncStatus';
import { useT } from '@/lib/i18n/useT';
import { Badge } from '@/components/ui/badge';

export function SyncProgressPanel() {
  const fr = useT();
  const { data: syncs } = useSyncStatus();
  const lastSync = syncs?.[0];

  if (!lastSync) return null;

  const variant =
    lastSync.sync_status === 'completed' ? 'default'
    : lastSync.sync_status === 'running' ? 'secondary'
    : 'destructive';

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground hidden sm:inline">{fr.dashboard.lastSync} :</span>
      <Badge variant={variant}>
        {lastSync.sync_source} — {lastSync.sync_status}
      </Badge>
    </div>
  );
}
