import { fr } from '@/i18n/fr';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useDestinationLogs } from '@/hooks/useWebhookDestinations';
import type { LogTrigger } from '@/lib/types/webhook-destinations';

interface Props {
  destinationId: string;
}

function triggerLabel(t: LogTrigger): string {
  return fr.destinations.logs.triggers[t];
}

function truncateAccountId(id: string): string {
  return id.length > 14 ? `${id.slice(0, 6)}…${id.slice(-6)}` : id;
}

export default function DestinationLogs({ destinationId }: Props) {
  const { data: logs, isLoading } = useDestinationLogs(destinationId);

  if (isLoading) {
    return (
      <div className="space-y-2 mt-2">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-10">
        {fr.destinations.logs.empty}
      </p>
    );
  }

  return (
    <div className="mt-2 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-border/50">
            <th className="pb-2 pr-4 text-muted-foreground font-medium whitespace-nowrap">
              {fr.destinations.logs.colDate}
            </th>
            <th className="pb-2 pr-4 text-muted-foreground font-medium">
              {fr.destinations.logs.colAccount}
            </th>
            <th className="pb-2 pr-4 text-muted-foreground font-medium">
              {fr.destinations.logs.colTrigger}
            </th>
            <th className="pb-2 pr-4 text-muted-foreground font-medium">
              {fr.destinations.logs.colStatus}
            </th>
            <th className="pb-2 text-muted-foreground font-medium">
              {fr.destinations.logs.colResult}
            </th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-b border-border/30 last:border-0">
              <td className="py-2.5 pr-4 text-muted-foreground whitespace-nowrap text-xs">
                {fr.format.dateTime(log.created_at)}
              </td>
              <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">
                {truncateAccountId(log.account_id)}
              </td>
              <td className="py-2.5 pr-4 text-muted-foreground text-xs">
                {triggerLabel(log.triggered_by)}
              </td>
              <td className="py-2.5 pr-4">
                <span
                  className={
                    log.response_status >= 200 && log.response_status < 300
                      ? 'text-emerald-600 font-mono text-xs'
                      : 'text-red-600 font-mono text-xs'
                  }
                >
                  {log.response_status}
                </span>
              </td>
              <td className="py-2.5">
                <Badge
                  className={
                    log.success
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-red-100 text-red-700 hover:bg-red-100'
                  }
                  variant="secondary"
                >
                  {log.success ? fr.destinations.logs.success : fr.destinations.logs.failure}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
