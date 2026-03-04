import { useOpsHealthCheck } from '@/hooks/useOpsHealthCheck';
import { fr } from '@/i18n/fr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import type { CheckStatus, HealthStatus } from '@/types/ops';

const healthStatusLabel: Record<HealthStatus, string> = {
  ok: fr.ops.healthy,
  degraded: fr.ops.degraded,
  unhealthy: fr.ops.unhealthy,
};

function checkBadgeVariant(
  status: CheckStatus,
): 'default' | 'secondary' | 'destructive' {
  switch (status) {
    case 'ok':
      return 'default';
    case 'warning':
      return 'secondary';
    case 'critical':
      return 'destructive';
  }
}

function checkIcon(status: CheckStatus) {
  switch (status) {
    case 'ok':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    case 'critical':
      return <XCircle className="h-4 w-4 text-red-600" />;
  }
}

function HealthBanner({ status }: { status: HealthStatus }) {
  if (status === 'unhealthy') {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-center gap-3">
        <XCircle className="h-5 w-5 text-red-600 shrink-0" />
        <p className="text-sm font-medium text-red-800">{fr.ops.unhealthy}</p>
      </div>
    );
  }
  if (status === 'degraded') {
    return (
      <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
        <p className="text-sm font-medium text-yellow-800">{fr.ops.degraded}</p>
      </div>
    );
  }
  return null;
}

export default function SystemStatusTab() {
  const { data, isLoading, isFetching, error, dataUpdatedAt } = useOpsHealthCheck();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6">
          <p className="text-destructive">{fr.common.error}</p>
        </CardContent>
      </Card>
    );
  }

  const overallVariant: 'default' | 'secondary' | 'destructive' =
    data.status === 'ok'
      ? 'default'
      : data.status === 'degraded'
        ? 'secondary'
        : 'destructive';

  return (
    <div className="space-y-4">
      <HealthBanner status={data.status} />

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              {fr.ops.healthStatus}
              <Badge variant={overallVariant}>{healthStatusLabel[data.status]}</Badge>
            </CardTitle>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className={`h-3 w-3${isFetching ? ' animate-spin' : ''}`} />
              {fr.ops.autoRefresh}
              {dataUpdatedAt > 0 && (
                <span>
                  — {fr.ops.lastCheck} :{' '}
                  {fr.format.dateTime(new Date(dataUpdatedAt).toISOString())}
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{fr.ops.checkName}</TableHead>
                <TableHead>{fr.ops.checkStatus}</TableHead>
                <TableHead>{fr.ops.checkMessage}</TableHead>
                <TableHead className="text-right">
                  {fr.ops.checkLatency}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.checks.map((check, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{check.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {checkIcon(check.status)}
                      <Badge
                        variant={checkBadgeVariant(check.status)}
                        className="capitalize"
                      >
                        {check.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {check.message || '–'}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {check.latency_ms !== undefined
                      ? `${check.latency_ms}ms`
                      : '–'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
