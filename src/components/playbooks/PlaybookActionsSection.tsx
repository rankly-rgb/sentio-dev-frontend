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

            return (
              <li key={action.step} className="flex items-start gap-3 p-3 border rounded-lg">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  {action.step}
                </span>
                <Icon className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{label}</p>
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
