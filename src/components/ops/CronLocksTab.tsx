import { useOpsCronLocks } from '@/hooks/useOpsCronLocks';
import { useT } from '@/lib/i18n/useT';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Unlock, Lock } from 'lucide-react';

function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

export default function CronLocksTab() {
  const fr = useT();
  const { locks, isLoading, error, refetch, forceRelease } =
    useOpsCronLocks();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {locks.length} {fr.ops.cronLocksTitle.toLowerCase()}
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {fr.common.retry}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4" />
            {fr.ops.cronLocksTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6">
              <p className="text-destructive">{fr.common.error}</p>
            </div>
          ) : locks.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {fr.ops.noLocks}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{fr.ops.lockKey}</TableHead>
                  <TableHead>{fr.ops.lockedBy}</TableHead>
                  <TableHead>{fr.ops.lockedAt}</TableHead>
                  <TableHead>{fr.ops.expiresAt}</TableHead>
                  <TableHead>{fr.ops.checkStatus}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {locks.map((lock) => {
                  const expired = isExpired(lock.expires_at);
                  return (
                    <TableRow
                      key={lock.id}
                      className={expired ? 'bg-red-50/50' : ''}
                    >
                      <TableCell className="font-mono text-sm">
                        {lock.lock_key}
                      </TableCell>
                      <TableCell className="text-sm">
                        {lock.locked_by}
                      </TableCell>
                      <TableCell className="text-sm">
                        {fr.format.dateTime(lock.locked_at)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {fr.format.dateTime(lock.expires_at)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={expired ? 'destructive' : 'outline'}
                        >
                          {expired ? fr.ops.expired : fr.ops.active}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => forceRelease.mutate(lock.id)}
                          disabled={forceRelease.isPending && forceRelease.variables === lock.id}
                        >
                          <Unlock className="h-3.5 w-3.5 mr-1" />
                          {fr.ops.forceRelease}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
