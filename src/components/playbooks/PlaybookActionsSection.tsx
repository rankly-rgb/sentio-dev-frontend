import {
  MessageSquare,
  ListTodo,
  UserCheck,
  Tag,
  FileText,
  CalendarClock,
  Flag,
  Mail,
} from 'lucide-react';
import { fr } from '@/i18n/fr';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PlaybookFullDetailAction, ActionType } from '@/lib/types/playbook';

const actionIcons: Record<string, React.ElementType> = {
  slack_notify: MessageSquare,
  slack_notification: MessageSquare,
  create_task: ListTodo,
  assign_owner: UserCheck,
  update_tag: Tag,
  log_note: FileText,
  schedule_review: CalendarClock,
  flag_for_review: Flag,
  send_email: Mail,
  hubspot_sequence: Mail,
};

const ACTIVE_ACTIONS: ReadonlySet<string> = new Set([
  'slack_notify',
  'create_task',
  'flag_for_review',
  'log_note',
]);

interface Props {
  actions: PlaybookFullDetailAction[];
}

export default function PlaybookActionsSection({ actions }: Props) {
  if (!Array.isArray(actions) || actions.length === 0) {
    return null;
  }

  const sorted = [...actions].sort((a, b) => a.step - b.step);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{fr.playbooks.actionsSequenceTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-2">
          {sorted.map((action) => {
            const Icon = actionIcons[action.type] ?? Flag;
            const label =
              fr.playbooks.actionType[action.type as ActionType] ?? action.label;
            const isActive = ACTIVE_ACTIONS.has(action.type);

            return (
              <li key={action.step} className="flex items-start gap-3 p-3 border rounded-lg">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  {action.step}
                </span>
                <Icon className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{label}</p>
                    <Badge
                      variant={isActive ? 'default' : 'secondary'}
                      className={isActive
                        ? 'bg-green-100 text-green-800 hover:bg-green-100 text-[10px] px-1.5 py-0'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-100 text-[10px] px-1.5 py-0'}
                    >
                      {isActive ? fr.playbooks.actionStatusActive : fr.playbooks.actionStatusSoon}
                    </Badge>
                  </div>
                  {action.detail && (
                    <p className="text-xs text-muted-foreground truncate">{action.detail}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
