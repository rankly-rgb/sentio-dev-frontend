import { useState } from 'react';
import { useOpsSyncsExtended } from '@/hooks/useOpsSyncsExtended';
import { useT } from '@/lib/i18n/useT';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import type { SyncStatus } from '@/types/database';
import type { SyncsExtendedFilters } from '@/types/ops';

// ─── Helpers (mêmes que Syncs.tsx) ──────────────────────────────────────

function statusVariant(
  s: SyncStatus,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (s) {
    case 'completed':
      return 'default';
    case 'running':
      return 'secondary';
    case 'failed':
      return 'destructive';
    default:
      return 'outline';
  }
}

function statusIcon(s: SyncStatus) {
  switch (s) {
    case 'completed':
      return <CheckCircle className="h-3.5 w-3.5 text-success" />;
    case 'running':
      return <Loader2 className="h-3.5 w-3.5 animate-spin" />;
    case 'failed':
      return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
    default:
      return <Clock className="h-3.5 w-3.5" />;
  }
}

function formatDuration(s: number | null, seconds: string) {
  if (s === null) return '–';
  if (s < 60) return `${s}${seconds}`;
  return `${Math.floor(s / 60)}m${s % 60}s`;
}

// ─── Component ──────────────────────────────────────────────────────────

export default function SyncsExtendedTab() {
  const fr = useT();
  const [filters, setFilters] = useState<SyncsExtendedFilters>({
    status: 'all',
    source: 'all',
    page: 1,
  });

  const { syncs, totalCount, isLoading, error, refetch, pageSize } =
    useOpsSyncsExtended(filters);

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex gap-3 flex-wrap items-end">
        <Select
          value={filters.status}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, status: v, page: 1 }))
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder={fr.ops.filterStatus} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{fr.common.all}</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="rate_limited">Rate Limited</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.source}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, source: v, page: 1 }))
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder={fr.ops.filterSource} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{fr.common.all}</SelectItem>
            <SelectItem value="stripe">Stripe</SelectItem>
            <SelectItem value="hubspot">HubSpot</SelectItem>
            <SelectItem value="usage">Usage</SelectItem>
            <SelectItem value="manual">Manuel</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {fr.common.retry}
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {fr.ops.syncsExtTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6">
              <p className="text-destructive">{fr.common.error}</p>
            </div>
          ) : syncs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {fr.syncs.noSyncs}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{fr.syncs.source}</TableHead>
                  <TableHead>{fr.syncs.type}</TableHead>
                  <TableHead>{fr.syncs.status}</TableHead>
                  <TableHead>{fr.syncs.startedAt}</TableHead>
                  <TableHead className="text-right">
                    {fr.syncs.duration}
                  </TableHead>
                  <TableHead className="text-right">
                    {fr.syncs.recordsProcessed}
                  </TableHead>
                  <TableHead className="text-right">
                    {fr.syncs.recordsFailed}
                  </TableHead>
                  <TableHead>{fr.syncs.errorMessage}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {syncs.map((sync) => (
                  <TableRow key={sync.id}>
                    <TableCell className="font-medium capitalize">
                      {sync.sync_source}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {sync.sync_type ?? '–'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusVariant(sync.sync_status)}
                        className="flex w-fit items-center gap-1"
                      >
                        {statusIcon(sync.sync_status)}
                        {sync.sync_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {sync.started_at
                        ? fr.format.dateTime(sync.started_at)
                        : '–'}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatDuration(sync.duration_seconds, fr.syncs.seconds)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {sync.records_processed ?? '–'}
                    </TableCell>
                    <TableCell className="text-right text-sm text-destructive">
                      {sync.records_failed ?? '–'}
                    </TableCell>
                    <TableCell
                      className="text-sm text-destructive max-w-xs truncate"
                      title={sync.error_message || ''}
                    >
                      {sync.error_message || '–'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalCount > pageSize && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {fr.common.showing}{' '}
            {(filters.page - 1) * pageSize + 1}–
            {Math.min(filters.page * pageSize, totalCount)} {fr.common.of}{' '}
            {totalCount}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={filters.page <= 1}
              onClick={() =>
                setFilters((f) => ({ ...f, page: f.page - 1 }))
              }
            >
              {fr.common.previous}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={filters.page * pageSize >= totalCount}
              onClick={() =>
                setFilters((f) => ({ ...f, page: f.page + 1 }))
              }
            >
              {fr.common.next}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
