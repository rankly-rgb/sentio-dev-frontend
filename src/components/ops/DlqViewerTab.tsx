import { useState } from 'react';
import { useOpsDlq } from '@/hooks/useOpsDlq';
import { fr } from '@/i18n/fr';
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
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, CheckCircle, Inbox } from 'lucide-react';
import type { DlqFilters } from '@/types/ops';

export default function DlqViewerTab() {
  const [filters, setFilters] = useState<DlqFilters>({
    provider: 'all',
    event_type: 'all',
    page: 1,
  });

  const {
    dlqEntries,
    totalCount,
    isLoading,
    error,
    refetch,
    markResolved,
    pageSize,
  } = useOpsDlq(filters);

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex gap-3 flex-wrap items-end">
        <Select
          value={filters.provider}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, provider: v, page: 1 }))
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder={fr.ops.dlqFilterProvider} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{fr.common.all}</SelectItem>
            <SelectItem value="stripe">Stripe</SelectItem>
            <SelectItem value="hubspot">HubSpot</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.event_type}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, event_type: v, page: 1 }))
          }
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder={fr.ops.dlqFilterEventType} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{fr.common.all}</SelectItem>
            <SelectItem value="customer.subscription.updated">
              customer.subscription.updated
            </SelectItem>
            <SelectItem value="invoice.paid">invoice.paid</SelectItem>
            <SelectItem value="invoice.payment_failed">
              invoice.payment_failed
            </SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="date"
          className="w-44"
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              date_from: e.target.value || undefined,
              page: 1,
            }))
          }
        />

        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {fr.common.retry}
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{fr.ops.dlqTitle}</CardTitle>
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
          ) : dlqEntries.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Inbox className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              {fr.ops.dlqEmpty}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{fr.ops.dlqProvider}</TableHead>
                  <TableHead>{fr.ops.dlqEventType}</TableHead>
                  <TableHead>{fr.ops.dlqError}</TableHead>
                  <TableHead className="text-right">
                    {fr.ops.dlqRetries}
                  </TableHead>
                  <TableHead>{fr.ops.dlqCreatedAt}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {dlqEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {entry.provider}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {entry.event_type}
                    </TableCell>
                    <TableCell
                      className="text-sm text-destructive max-w-xs truncate"
                      title={entry.error_message || ''}
                    >
                      {entry.error_message || '–'}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.retry_count}
                    </TableCell>
                    <TableCell className="text-sm">
                      {fr.format.dateTime(entry.created_at)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markResolved.mutate(entry.id)}
                        disabled={markResolved.isPending}
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        {fr.ops.dlqMarkResolved}
                      </Button>
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
