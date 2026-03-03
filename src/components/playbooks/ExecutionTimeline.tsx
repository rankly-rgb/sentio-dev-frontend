import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
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
import { fr } from '@/i18n/fr';
import type { PlaybookExecutionRow } from '@/lib/types/playbook';

function statusVariant(s: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (s) {
    case 'completed': return 'default';
    case 'running': return 'secondary';
    case 'failed': return 'destructive';
    default: return 'outline';
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'completed': return <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />;
    case 'running': return <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />;
    case 'failed': return <XCircle className="h-3.5 w-3.5 text-destructive" />;
    default: return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
  }
}

const statusLabels: Record<string, string> = {
  pending: fr.actions.pending,
  running: fr.actions.running,
  completed: fr.actions.completed,
  failed: fr.actions.failed,
  cancelled: 'Annulée',
};

interface Props {
  executions: PlaybookExecutionRow[];
  isLoading?: boolean;
}

export default function ExecutionTimeline({ executions, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!executions || executions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        {fr.playbooks.noExecutions}
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Statut</TableHead>
          <TableHead>Compte</TableHead>
          <TableHead>Début</TableHead>
          <TableHead>Fin</TableHead>
          <TableHead>Erreur</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {executions.map((exec) => (
          <TableRow key={exec.id}>
            <TableCell>
              <Badge variant={statusVariant(exec.status)} className="flex w-fit items-center gap-1">
                <StatusIcon status={exec.status} />
                {statusLabels[exec.status] ?? exec.status}
              </Badge>
            </TableCell>
            <TableCell className="font-mono text-xs">{exec.account_id.slice(0, 8)}…</TableCell>
            <TableCell className="text-xs">
              {exec.started_at ? fr.format.dateTime(exec.started_at) : '–'}
            </TableCell>
            <TableCell className="text-xs">
              {exec.completed_at ? fr.format.dateTime(exec.completed_at) : '–'}
            </TableCell>
            <TableCell className="text-xs text-destructive max-w-[200px] truncate" title={exec.error_message ?? ''}>
              {exec.error_message ?? '–'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
