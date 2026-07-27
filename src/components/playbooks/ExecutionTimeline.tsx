import { useState } from 'react';
import { CheckCircle, XCircle, Clock, Loader2, SkipForward, ChevronDown, ChevronRight } from 'lucide-react';
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
import { useT } from '@/lib/i18n/useT';
import ExecutionAttributionCell from '@/components/playbooks/ExecutionAttributionCell';
import type { PlaybookExecutionRow, ExecutionCompletedAction } from '@/lib/types/playbook';

function statusVariant(s: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (s) {
    case 'completed': return 'default';
    case 'running': return 'secondary';
    case 'failed': return 'destructive';
    default: return 'outline';
  }
}

function statusExtraClass(s: string): string {
  if (s === 'partially_completed') return 'border-amber-400 text-amber-700 bg-amber-50 hover:bg-amber-50';
  return '';
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'completed': return <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />;
    case 'partially_completed': return <CheckCircle className="h-3.5 w-3.5 text-amber-500" />;
    case 'running': return <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />;
    case 'failed': return <XCircle className="h-3.5 w-3.5 text-destructive" />;
    default: return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
  }
}

function ActionStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'completed': return <CheckCircle className="h-3 w-3 text-emerald-500" />;
    case 'failed': return <XCircle className="h-3 w-3 text-destructive" />;
    case 'skipped': return <SkipForward className="h-3 w-3 text-gray-400" />;
    default: return <Clock className="h-3 w-3 text-muted-foreground" />;
  }
}

function ActionDetails({ actions }: { actions: ExecutionCompletedAction[] }) {
  const fr = useT();
  return (
    <div className="space-y-1 pl-4 border-l-2 border-muted">
      {[...actions].sort((a, b) => a.order - b.order).map((action, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <ActionStatusIcon status={action.status} />
          <span className="font-medium">
            {fr.playbooks.actionType[action.action_type as keyof typeof fr.playbooks.actionType] ?? action.action_type}
          </span>
          {action.status === 'skipped' ? (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-500 hover:bg-gray-100"
            >
              {fr.playbooks.actionSkipped}
              {action.message ? ` — ${action.message}` : ''}
            </Badge>
          ) : (
            <span className="text-muted-foreground truncate max-w-[200px]">{action.message}</span>
          )}
        </div>
      ))}
    </div>
  );
}

interface Props {
  executions: PlaybookExecutionRow[];
  isLoading?: boolean;
}

export default function ExecutionTimeline({ executions, isLoading }: Props) {
  const fr = useT();
  const statusLabels: Record<string, string> = {
    pending: fr.actions.pending,
    running: fr.actions.running,
    completed: fr.actions.completed,
    partially_completed: fr.playbooks.executionStatusLabels.partially_completed,
    failed: fr.actions.failed,
    cancelled: 'Cancelled',
  };
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

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
          <TableHead className="w-8" />
          <TableHead>{fr.playbooks.execTable.status}</TableHead>
          <TableHead>{fr.playbooks.execTable.account}</TableHead>
          <TableHead>{fr.playbooks.execTable.actions}</TableHead>
          <TableHead>{fr.playbooks.execTable.start}</TableHead>
          <TableHead>{fr.playbooks.execTable.end}</TableHead>
          <TableHead>{fr.playbooks.execTable.error}</TableHead>
          <TableHead>{fr.playbooks.attribution.columnHeader}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {executions.map((exec) => {
          const actions = Array.isArray(exec.actions_completed) ? exec.actions_completed : [];
          const hasActions = actions.length > 0;
          const isExpanded = expandedRows.has(exec.id);
          const completedCount = actions.filter(a => a.status === 'completed').length;
          const failedCount = actions.filter(a => a.status === 'failed').length;
          const skippedCount = actions.filter(a => a.status === 'skipped').length;

          return (
            <>
              <TableRow
                key={exec.id}
                className={hasActions ? 'cursor-pointer' : ''}
                onClick={() => hasActions && toggleRow(exec.id)}
              >
                <TableCell className="w-8 px-2">
                  {hasActions && (
                    isExpanded
                      ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(exec.status)} className={`flex w-fit items-center gap-1 ${statusExtraClass(exec.status)}`}>
                    <StatusIcon status={exec.status} />
                    {statusLabels[exec.status] ?? exec.status}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">{exec.account_id.slice(0, 8)}…</TableCell>
                <TableCell className="text-xs">
                  {hasActions ? (
                    <span className="flex items-center gap-1.5">
                      {completedCount > 0 && <span className="text-emerald-600">{completedCount} ok</span>}
                      {failedCount > 0 && <span className="text-destructive">{failedCount} err</span>}
                      {skippedCount > 0 && <span className="text-gray-400">{skippedCount} skip</span>}
                    </span>
                  ) : '–'}
                </TableCell>
                <TableCell className="text-xs">
                  {exec.started_at ? fr.format.dateTime(exec.started_at) : '–'}
                </TableCell>
                <TableCell className="text-xs">
                  {exec.completed_at ? fr.format.dateTime(exec.completed_at) : '–'}
                </TableCell>
                <TableCell className="text-xs text-destructive max-w-[200px] truncate" title={exec.error_message ?? ''}>
                  {exec.error_message ?? '–'}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <ExecutionAttributionCell executionId={exec.id} />
                </TableCell>
              </TableRow>
              {isExpanded && hasActions && (
                <TableRow key={`${exec.id}-actions`}>
                  <TableCell />
                  <TableCell colSpan={7} className="py-2">
                    <ActionDetails actions={actions} />
                  </TableCell>
                </TableRow>
              )}
            </>
          );
        })}
      </TableBody>
    </Table>
  );
}
