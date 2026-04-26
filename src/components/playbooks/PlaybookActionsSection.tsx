import {
  MessageSquare,
  ListTodo,
  UserCheck,
  Tag,
  FileText,
  CalendarClock,
  Flag,
  Mail,
  ListChecks,
  Building2,
} from 'lucide-react';
import { fr } from '@/i18n/fr';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PlaybookDetailAction, ActionType } from '@/lib/types/playbook';

const ACTION_ICON_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  slack_notify: { icon: MessageSquare, color: 'text-green-600' },
  slack_notification: { icon: MessageSquare, color: 'text-green-600' },
  create_task: { icon: ListTodo, color: 'text-blue-600' },
  assign_owner: { icon: UserCheck, color: 'text-gray-600' },
  update_tag: { icon: Tag, color: 'text-blue-600' },
  log_note: { icon: FileText, color: 'text-gray-600' },
  schedule_review: { icon: CalendarClock, color: 'text-blue-600' },
  flag_for_review: { icon: Flag, color: 'text-green-600' },
  send_email_hubspot: { icon: Mail, color: 'text-orange-600' },
  send_email: { icon: Mail, color: 'text-blue-600' },
  hubspot_sequence: { icon: Mail, color: 'text-blue-600' },
  hubspot_enroll_sequence: { icon: ListChecks, color: 'text-orange-600' },
  hubspot_update_company: { icon: Building2, color: 'text-orange-600' },
};

const DEFAULT_ICON_CONFIG = { icon: Flag, color: 'text-gray-500' };

interface Props {
  actions: PlaybookDetailAction[];
}

export default function PlaybookActionsSection({ actions }: Props) {
  if (!Array.isArray(actions) || actions.length === 0) {
    return null;
  }

  const sorted = [...actions].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{fr.playbooks.actionsSequenceTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {sorted.map((action, idx) => {
            const config = ACTION_ICON_CONFIG[action.action_type] ?? DEFAULT_ICON_CONFIG;
            const Icon = config.icon;
            const label =
              fr.playbooks.actionType[action.action_type as ActionType] ?? action.label;
            const isLast = idx === sorted.length - 1;

            return (
              <div
                key={action.id}
                className="relative flex items-start gap-3 pb-4"
                style={{ opacity: action.is_active ? 1 : 0.55 }}
              >
                {/* Vertical connector line */}
                {!isLast && (
                  <div
                    className="absolute left-[13.5px] top-8 bottom-0 w-[1.5px] bg-border"
                    aria-hidden
                  />
                )}

                {/* Step circle */}
                <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
                  {idx + 1}
                </span>

                {/* Icon + content */}
                <Icon className={`h-4 w-4 shrink-0 mt-1.5 ${config.color}`} />
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{label}</p>
                    <Badge
                      variant="secondary"
                      className={
                        action.is_active
                          ? 'bg-green-100 text-green-800 hover:bg-green-100 text-[10px] px-1.5 py-0'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-100 text-[10px] px-1.5 py-0'
                      }
                    >
                      {action.is_active ? fr.playbooks.actionStatusActive : fr.playbooks.actionStatusSoon}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
