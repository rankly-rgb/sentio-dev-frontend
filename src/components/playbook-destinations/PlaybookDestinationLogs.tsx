import { CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useT } from '@/lib/i18n/useT';
import { usePlaybookExecutionLogs } from '@/hooks/usePlaybookDestinations';

interface Props {
  destinationId: string;
}

export default function PlaybookDestinationLogs({ destinationId }: Props) {
  const fr = useT();
  const { data: logs, isLoading, isError } = usePlaybookExecutionLogs(destinationId);
  const t = fr.playbookDestinations.logs;

  if (isLoading) {
    return (
      <div className="space-y-2 py-2">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-destructive py-4">{fr.common.error}</p>;
  }

  if (!logs || logs.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8 italic">{t.empty}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t.date}</TableHead>
          <TableHead>{t.trigger}</TableHead>
          <TableHead>{t.status}</TableHead>
          <TableHead>{t.httpStatus}</TableHead>
          <TableHead>{t.response}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => (
          <TableRow key={log.id}>
            <TableCell className="text-sm whitespace-nowrap">
              {fr.format.dateTime(log.executed_at)}
            </TableCell>

            <TableCell>
              <Badge variant="outline" className="text-xs">
                {log.trigger_reason}
              </Badge>
            </TableCell>

            <TableCell>
              {log.success ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
            </TableCell>

            <TableCell className="text-sm text-muted-foreground">
              {log.http_status ?? '—'}
            </TableCell>

            <TableCell className="max-w-xs">
              {log.connector_response ? (
                <span
                  className="text-xs text-muted-foreground truncate block"
                  title={log.connector_response}
                >
                  {log.connector_response.slice(0, 80)}
                  {log.connector_response.length > 80 ? '…' : ''}
                </span>
              ) : (
                '—'
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
