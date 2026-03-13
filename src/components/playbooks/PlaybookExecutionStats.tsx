import { Info } from 'lucide-react';
import { fr } from '@/i18n/fr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PlaybookDetailExecutionStats } from '@/lib/types/playbook';

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}

function StatCard({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: number;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-md bg-secondary px-4 py-3">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`text-[20px] font-medium mt-0.5 ${valueClassName ?? ''}`}>{value}</p>
    </div>
  );
}

interface Props {
  stats: PlaybookDetailExecutionStats;
}

export default function PlaybookExecutionStats({ stats }: Props) {
  const allZero =
    stats.total === 0 &&
    stats.completed === 0 &&
    stats.failed === 0 &&
    stats.in_progress === 0 &&
    stats.mrr_recovered_cents === 0 &&
    stats.mrr_expansion_cents === 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{fr.playbooks.executionStatsTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 4 stat cards in a 2x2 grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label={fr.playbooks.totalExecutions} value={stats.total} />
          <StatCard
            label={fr.playbooks.completedExec}
            value={stats.completed}
            valueClassName="text-emerald-600"
          />
          <StatCard
            label={fr.playbooks.failedExec}
            value={stats.failed}
            valueClassName={stats.failed > 0 ? 'text-destructive' : undefined}
          />
          <StatCard label={fr.playbooks.runningExec} value={stats.in_progress} />
        </div>

        {/* MRR rows */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{fr.playbooks.mrrRecovered}</span>
            <span className="font-medium">{formatCurrency(stats.mrr_recovered_cents)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{fr.playbooks.mrrExpansion}</span>
            <span className="font-medium">{formatCurrency(stats.mrr_expansion_cents)}</span>
          </div>
        </div>

        {/* Inline muted note when all stats are 0 */}
        {allZero && (
          <div className="flex items-start gap-2 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{fr.playbooks.statsEmptyNote}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
