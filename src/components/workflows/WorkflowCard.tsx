import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fr } from '@/i18n/fr';
import PlaybookStatusBadge from '@/components/playbooks/PlaybookStatusBadge';
import PriorityBadge from '@/components/playbooks/PriorityBadge';
import type { Playbook } from '@/lib/types/playbook';

interface Props {
  playbook: Playbook;
}

export default function WorkflowCard({ playbook }: Props) {
  const navigate = useNavigate();
  const stepCount = playbook.steps?.length ?? 0;

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => navigate(`/workflows/${playbook.id}`)}
    >
      <CardContent className="p-5 space-y-3">
        {/* Header: badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <PlaybookStatusBadge status={playbook.status} />
          <PriorityBadge priority={playbook.priority} />
          <Badge variant="secondary" className="text-xs">
            {fr.workflows.workflowBadge}
          </Badge>
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

        {/* Mini step dots */}
        {stepCount > 0 && (
          <div className="flex items-center gap-1.5">
            {Array.from({ length: Math.min(stepCount, 8) }).map((_, i) => (
              <div
                key={i}
                className="h-2 w-2 rounded-full bg-primary/40"
              />
            ))}
            {stepCount > 8 && (
              <span className="text-xs text-muted-foreground">+{stepCount - 8}</span>
            )}
            <span className="text-xs text-muted-foreground ml-2">
              {stepCount} {fr.workflows.stepCount}
            </span>
          </div>
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
            {fr.playbooks.kpi.targeted} : {playbook.accounts_targeted ?? 0}
          </span>
          <span>
            {fr.playbooks.kpi.converted} : {playbook.accounts_converted ?? 0}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
