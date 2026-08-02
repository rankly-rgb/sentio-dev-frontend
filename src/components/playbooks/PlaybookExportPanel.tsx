import { useState } from 'react';
import { FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useT } from '@/lib/i18n/useT';
import {
  usePlaybookExportPreview,
  usePlaybookRuns,
  useExportPlaybookCsv,
  useMarkPlaybookRunExecuted,
} from '@/hooks/usePlaybooks';

interface PlaybookExportPanelProps {
  playbookId: string;
}

export default function PlaybookExportPanel({ playbookId }: PlaybookExportPanelProps) {
  const fr = useT();
  const { data: preview, isLoading: previewLoading } = usePlaybookExportPreview(playbookId);
  const { data: runs, isLoading: runsLoading } = usePlaybookRuns(playbookId);
  const exportMutation = useExportPlaybookCsv(playbookId);
  const markExecutedMutation = useMarkPlaybookRunExecuted(playbookId);
  const [markingRunId, setMarkingRunId] = useState<string | null>(null);

  const handleMarkExecuted = (runId: string) => {
    setMarkingRunId(runId);
    markExecutedMutation.mutate(runId, { onSettled: () => setMarkingRunId(null) });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{fr.playbookExport.sectionTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {previewLoading ? (
          <div className="flex gap-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-6 w-40" />
          </div>
        ) : preview ? (
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">{fr.playbookExport.targetedAccounts} : </span>
              <span className="font-semibold">{preview.accounts_count}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{fr.playbookExport.mrrAtRisk} : </span>
              <span className="font-semibold">{fr.format.currency(preview.mrr_at_risk_cents)}</span>
            </div>
          </div>
        ) : null}

        {preview && preview.accounts_count === 0 && (
          <p className="text-sm text-muted-foreground">{fr.playbookExport.noTargets}</p>
        )}

        <Button
          variant="outline"
          onClick={() => exportMutation.mutate()}
          disabled={exportMutation.isPending || !preview?.accounts_count}
        >
          {exportMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileText className="h-4 w-4 mr-2" />
          )}
          {exportMutation.isPending ? fr.playbookExport.exporting : fr.playbookExport.exportCsv}
        </Button>

        <div className="pt-2 border-t space-y-2">
          <h4 className="text-sm font-medium">{fr.playbookExport.runHistory}</h4>
          {runsLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : !runs?.length ? (
            <p className="text-sm text-muted-foreground">{fr.playbookExport.noRuns}</p>
          ) : (
            <ul className="space-y-2">
              {runs.map((run) => (
                <li
                  key={run.id}
                  className="flex items-center justify-between gap-3 text-sm border rounded-md px-3 py-2"
                >
                  <div>
                    <div className="font-medium">
                      {run.accounts_count} accounts &middot; {fr.format.currency(run.mrr_at_risk_cents)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {run.status === 'executed' && run.executed_at
                        ? fr.playbookExport.executedOn(fr.format.date(run.executed_at))
                        : fr.playbookExport.exportedOn(fr.format.date(run.exported_at))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={run.status === 'executed' ? 'default' : 'outline'}>
                      {run.status === 'executed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {run.status === 'executed'
                        ? fr.playbookExport.statusExecuted
                        : fr.playbookExport.statusExported}
                    </Badge>
                    {run.status === 'exported' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMarkExecuted(run.id)}
                        disabled={markingRunId === run.id}
                      >
                        {markingRunId === run.id
                          ? fr.playbookExport.markingExecuted
                          : fr.playbookExport.markExecuted}
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
