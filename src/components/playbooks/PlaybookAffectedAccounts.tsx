import { fr } from '@/i18n/fr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PlaybookExportPanel from '@/components/playbooks/PlaybookExportPanel';
import type { PlaybookAffectedAccountsSummary } from '@/lib/types/playbook';

interface UrgencyPillProps {
  label: string;
  count: number;
  activeClassName: string;
}

function UrgencyPill({ label, count, activeClassName }: UrgencyPillProps) {
  return (
    <Badge
      variant={count > 0 ? 'default' : 'outline'}
      className={count > 0 ? activeClassName : ''}
    >
      {label} : {count}
    </Badge>
  );
}

interface Props {
  summary: PlaybookAffectedAccountsSummary;
  playbookId: string;
}

export default function PlaybookAffectedAccounts({ summary, playbookId }: Props) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{fr.playbooks.affectedAccountsTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Metrics */}
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <span className="text-sm text-muted-foreground">{fr.playbooks.affectedAccountsTitle} : </span>
              <span className="text-lg font-bold">{summary.total}</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">{fr.playbooks.mrrAtRisk} : </span>
              <span className="text-lg font-bold">{fr.format.currency(summary.mrr_at_risk_cents)}</span>
            </div>
          </div>

          {/* Urgency pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <UrgencyPill
              label={fr.playbooks.urgencyUrgent}
              count={summary.by_urgency.urgent}
              activeClassName="bg-red-500 text-white border-transparent hover:bg-red-500/80"
            />
            <UrgencyPill
              label={fr.playbooks.urgencyWatch}
              count={summary.by_urgency.watch}
              activeClassName="bg-amber-500 text-white border-transparent hover:bg-amber-500/80"
            />
            <UrgencyPill
              label={fr.playbooks.urgencyStable}
              count={summary.by_urgency.stable}
              activeClassName="bg-emerald-500 text-white border-transparent hover:bg-emerald-500/80"
            />
          </div>
        </CardContent>
      </Card>

      {/* Export panel (existing component with filters + export buttons) */}
      <PlaybookExportPanel playbookId={playbookId} />
    </div>
  );
}
