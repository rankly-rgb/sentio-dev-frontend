import { Info } from 'lucide-react';
import { fr } from '@/i18n/fr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type {
  PlaybookFullDetailPlaybook,
  PlaybookFullDetailStats,
  PlaybookStatus,
} from '@/lib/types/playbook';

interface Props {
  playbook: PlaybookFullDetailPlaybook;
  stats: PlaybookFullDetailStats;
}

export default function PlaybookExecutionStats({ playbook, stats }: Props) {
  const allZero =
    stats.executions_total === 0 &&
    stats.executions_completed === 0 &&
    stats.executions_failed === 0 &&
    stats.executions_in_progress === 0 &&
    stats.mrr_recovered_cents === 0 &&
    stats.mrr_expansion_cents === 0;

  const isDraft = playbook.status === ('draft' as PlaybookStatus);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{fr.playbooks.executionStatsTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column — metadata */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{fr.playbooks.metaType}</span>
              <span className="font-medium">
                {fr.playbooks.type[playbook.automation_type] ?? playbook.automation_type}
              </span>
            </div>
            {playbook.category && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{fr.playbooks.metaCategory}</span>
                <span className="font-medium">
                  {fr.playbooks.category[playbook.category as keyof typeof fr.playbooks.category] ?? playbook.category}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">{fr.playbooks.metaAutomated}</span>
              <span className="font-medium">
                {playbook.automation_type === 'automated' ? fr.common.yes : fr.common.no}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{fr.playbooks.metaApproval}</span>
              <span className="font-medium">
                {playbook.requires_approval ? fr.common.yes : fr.common.no}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{fr.playbooks.metaCreatedAt}</span>
              <span className="font-medium">{fr.format.dateTime(playbook.created_at)}</span>
            </div>
          </div>

          {/* Right column — execution metrics */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{fr.playbooks.totalExecutions}</span>
              <span className="font-medium">{stats.executions_total}</span>
            </div>
            <div className="flex justify-between pl-4">
              <span className="text-muted-foreground">{fr.playbooks.completedExec}</span>
              <span className="font-medium text-emerald-600">{stats.executions_completed}</span>
            </div>
            <div className="flex justify-between pl-4">
              <span className="text-muted-foreground">{fr.playbooks.failedExec}</span>
              <span className={`font-medium ${stats.executions_failed > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {stats.executions_failed}
              </span>
            </div>
            <div className="flex justify-between pl-4">
              <span className="text-muted-foreground">{fr.playbooks.runningExec}</span>
              <span className="font-medium">{stats.executions_in_progress}</span>
            </div>
            <div className="border-t pt-3 mt-3 flex justify-between">
              <span className="text-muted-foreground">{fr.playbooks.mrrRecovered}</span>
              <span className="font-medium">{fr.format.currency(stats.mrr_recovered_cents)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{fr.playbooks.mrrExpansion}</span>
              <span className="font-medium">{fr.format.currency(stats.mrr_expansion_cents)}</span>
            </div>
          </div>
        </div>

        {/* Contextual note for draft with all zeros */}
        {allZero && isDraft && (
          <div className="flex items-start gap-2 mt-4 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{fr.playbooks.statsEmptyNote}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
