import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { fr } from '@/i18n/fr';
import PlaybookStatusBadge from './PlaybookStatusBadge';
import PriorityBadge from './PriorityBadge';
import type { Playbook } from '@/lib/types/playbook';

interface Props {
  playbook: Playbook;
}

export default function PlaybookCard({ playbook }: Props) {
  const navigate = useNavigate();

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => navigate(`/playbooks/${playbook.id}`)}
    >
      <CardContent className="p-5 space-y-3">
        {/* Header: badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <PlaybookStatusBadge status={playbook.status} />
          <PriorityBadge priority={playbook.priority} />
          <span className="text-xs text-muted-foreground ml-auto">
            {fr.playbooks.type[playbook.playbook_type] ?? playbook.playbook_type}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-sm leading-tight line-clamp-2">
          {playbook.title}
        </h3>

        {/* Description */}
        {playbook.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {playbook.description}
          </p>
        )}

        {/* Category */}
        {playbook.template_category && (
          <span className="inline-block text-xs bg-muted px-2 py-0.5 rounded">
            {fr.playbooks.category[playbook.template_category] ?? playbook.template_category}
          </span>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
          <span>
            {fr.playbooks.kpi.targeted} : {playbook.current_eligible_count ?? 0}
          </span>
          <span>
            {fr.playbooks.kpi.converted} : {playbook.accounts_converted ?? 0}
          </span>
        </div>

        {/* Execution stats */}
        {playbook.execution_stats && (
          <div className="text-xs text-muted-foreground">
            {fr.playbooks.executions} : {playbook.execution_stats.total ?? 0}
            {playbook.execution_stats.last_executed_at && (
              <span className="ml-2">
                — {fr.playbooks.lastRun} : {fr.format.date(playbook.execution_stats.last_executed_at)}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
