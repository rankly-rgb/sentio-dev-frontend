import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useManualSync } from '@/hooks/useManualSync';
import { useT } from '@/lib/i18n/useT';
import type { DataSync, SyncStatus } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Calculator, AlertCircle, CheckCircle, Clock, Loader2 } from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

function statusVariant(s: SyncStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (s) {
    case 'completed': return 'default';
    case 'running': return 'secondary';
    case 'failed': return 'destructive';
    default: return 'outline';
  }
}

function statusIcon(s: SyncStatus) {
  switch (s) {
    case 'completed': return <CheckCircle className="h-3.5 w-3.5 text-success" />;
    case 'running': return <Loader2 className="h-3.5 w-3.5 animate-spin" />;
    case 'failed': return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
    default: return <Clock className="h-3.5 w-3.5" />;
  }
}

function formatDuration(s: number | null, seconds: string) {
  if (s === null) return '-';
  if (s < 60) return `${s}${seconds}`;
  return `${Math.floor(s / 60)}m${s % 60}s`;
}

function syncTypeLabel(t: string | null, labels: Record<string, string>) {
  if (!t) return '—';
  return labels[t] ?? t;
}

function syncTypeBadgeVariant(t: string | null): 'default' | 'secondary' | 'outline' {
  if (!t) return 'outline';
  if (t === 'full_sync' || t === 'initial') return 'secondary';
  return 'outline';
}

// ─── Fetcher ────────────────────────────────────────────────────────────────

async function fetchSyncs(orgId: string): Promise<DataSync[]> {
  const { data, error } = await supabase
    .from('data_syncs')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data || [];
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function Syncs() {
  const fr = useT();
  const { user } = useAuth();
  const qc = useQueryClient();
  // V2 - HubSpot : triggerHubspotSync aliasé en _triggerHubspotSync pour conserver le code mais satisfaire noUnusedLocals
  const { triggerStripeSync, triggerHubspotSync: _triggerHubspotSync, calculateScores, isSyncing, isSyncingHubspot, isCalculating } = useManualSync();

  const { data: syncs, isLoading, error } = useQuery({
    queryKey: ['syncs', user?.organization_id],
    queryFn: () => fetchSyncs(user?.organization_id ?? ''),
    enabled: !!user?.organization_id,
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
  });

  const running = (syncs || []).filter(s => s.sync_status === 'running');

  async function handleSync(type: 'incremental' | 'full_sync') {
    await triggerStripeSync(type);
    qc.invalidateQueries({ queryKey: ['syncs'] });
  }

  /* V2 - HubSpot
  async function handleHubspotSync() {
    await _triggerHubspotSync('daily');
    qc.invalidateQueries({ queryKey: ['syncs'] });
  }
  */

  async function handleCalculate() {
    await calculateScores();
    qc.invalidateQueries({ queryKey: ['syncs'] });
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">{fr.syncs.title}</h1>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSync('incremental')}
            disabled={isSyncing || isSyncingHubspot || isCalculating}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? fr.syncs.syncRunning : fr.syncs.syncStripeIncremental}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSync('full_sync')}
            disabled={isSyncing || isSyncingHubspot || isCalculating}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {fr.syncs.syncStripeFull}
          </Button>

          {/* V2 - HubSpot
          <Button
            variant="outline"
            size="sm"
            onClick={handleHubspotSync}
            disabled={isSyncing || isSyncingHubspot || isCalculating}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncingHubspot ? 'animate-spin' : ''}`} />
            {isSyncingHubspot ? fr.syncs.syncRunning : 'Sync HubSpot'}
          </Button>
          */}

          <Button
            variant="default"
            size="sm"
            onClick={handleCalculate}
            disabled={isSyncing || isSyncingHubspot || isCalculating}
          >
            <Calculator className={`h-4 w-4 mr-2 ${isCalculating ? 'animate-spin' : ''}`} />
            {isCalculating ? fr.syncs.calculating : fr.syncs.recalculateScores}
          </Button>
        </div>
      </div>

      {/* Indicateur sync en cours */}
      {running.length > 0 && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div>
              <p className="font-medium text-sm">Synchronisation en cours</p>
              <p className="text-xs text-muted-foreground">
                {running.map(s => s.sync_source).join(', ')} — démarré le{' '}
                {running[0].started_at ? fr.format.dateTime(running[0].started_at) : '…'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Historique des synchronisations</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : error ? (
            <div className="p-6">
              <p className="text-destructive">{fr.common.error}</p>
            </div>
          ) : !syncs || syncs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">{fr.syncs.noSyncs}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{fr.syncs.source}</TableHead>
                  <TableHead>{fr.syncs.type}</TableHead>
                  <TableHead>{fr.syncs.status}</TableHead>
                  <TableHead>{fr.syncs.startedAt}</TableHead>
                  <TableHead className="text-right">{fr.syncs.duration}</TableHead>
                  <TableHead className="text-right">{fr.syncs.recordsProcessed}</TableHead>
                  <TableHead className="text-right">{fr.syncs.recordsCreated}</TableHead>
                  <TableHead className="text-right">{fr.syncs.recordsUpdated}</TableHead>
                  <TableHead className="text-right">{fr.syncs.recordsFailed}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {syncs.map(sync => (
                  <TableRow key={sync.id}>
                    <TableCell className="font-medium capitalize">{sync.sync_source}</TableCell>
                    <TableCell>
                      <Badge variant={syncTypeBadgeVariant(sync.sync_type)} className="text-xs">
                        {syncTypeLabel(sync.sync_type, fr.syncs.syncTypeLabels)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusVariant(sync.sync_status)}
                        className="flex w-fit items-center gap-1"
                      >
                        {statusIcon(sync.sync_status)}
                        {sync.sync_status}
                      </Badge>
                      {sync.error_message && (
                        <p className="text-xs text-destructive mt-1 max-w-xs truncate" title={sync.error_message}>
                          {sync.error_message}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {sync.started_at ? fr.format.dateTime(sync.started_at) : '-'}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatDuration(sync.duration_seconds, fr.syncs.seconds)}
                    </TableCell>
                    <TableCell className="text-right text-sm">{sync.records_processed ?? '-'}</TableCell>
                    <TableCell className="text-right text-sm text-success">{sync.records_created ?? '-'}</TableCell>
                    <TableCell className="text-right text-sm">{sync.records_updated ?? '-'}</TableCell>
                    <TableCell className="text-right text-sm text-destructive">{sync.records_failed ?? '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
