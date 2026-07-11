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
import { useT } from '@/lib/i18n/useT';
import type { PlaybookAction, ActionType } from '@/lib/types/playbook';

const actionIcons: Record<ActionType, React.ElementType> = {
  slack_notify: MessageSquare,
  create_task: ListTodo,
  send_email_hubspot: Mail,
  assign_owner: UserCheck,
  update_tag: Tag,
  log_note: FileText,
  schedule_review: CalendarClock,
  flag_for_review: Flag,
  send_email: Mail,
  export_csv: FileText,
  hubspot_enroll_sequence: ListChecks,
  hubspot_update_company: Building2,
};

function summarizeConfig(type: ActionType, config: Record<string, unknown>): string {
  switch (type) {
    case 'slack_notify':
      return [config.channel, config.template].filter(Boolean).join(' — ');
    case 'create_task':
      return [config.title, config.due_days ? `${config.due_days}j` : ''].filter(Boolean).join(' — ');
    case 'assign_owner':
      return String(config.role ?? '');
    case 'update_tag':
      return String(config.tag ?? '');
    case 'log_note':
      return String(config.note ?? '');
    case 'schedule_review':
      return config.review_days ? `${config.review_days} days` : '';
    case 'flag_for_review':
      return '';
    case 'send_email_hubspot':
      return config.subject ? `Email HubSpot: "${String(config.subject)}"` : 'Email via HubSpot';
    case 'send_email':
      return config.subject ? `Email: "${String(config.subject)}"` : 'Email';
    case 'hubspot_enroll_sequence':
      return config.sequence_id ? `Sequence ${String(config.sequence_id)}` : '';
    case 'hubspot_update_company': {
      const props = config.properties as Record<string, string> | undefined;
      const count = props ? Object.keys(props).length : 0;
      return count > 0 ? `${count} propert${count > 1 ? 'ies' : 'y'}` : '';
    }
    default:
      return '';
  }
}

interface Props {
  actions: PlaybookAction[];
}

export default function ActionList({ actions }: Props) {
  const fr = useT();
  if (!actions || actions.length === 0) {
    return <p className="text-sm text-muted-foreground">{fr.playbooks.noActionsMsg}</p>;
  }

  // V2 - HubSpot/Slack : filtrer les actions non disponibles en V1
  const V2_ACTION_TYPES: string[] = ['slack_notify', 'send_email_hubspot', 'hubspot_enroll_sequence', 'hubspot_update_company'];
  const sorted = [...actions]
    .filter(a => !V2_ACTION_TYPES.includes(a.type))
    .sort((a, b) => a.order - b.order);

  if (sorted.length === 0) {
    return <p className="text-sm text-muted-foreground">{fr.playbooks.noActionsMsg}</p>;
  }

  return (
    <ol className="space-y-2">
      {sorted.map((action, idx) => {
        const Icon = actionIcons[action.type] ?? Flag;
        const label = fr.playbooks.actionType[action.type] ?? action.type;
        const summary = summarizeConfig(action.type, action.config);

        return (
          <li key={idx} className="flex items-start gap-3 p-3 border rounded-lg">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
              {idx + 1}
            </span>
            <Icon className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-sm font-medium">{label}</p>
              {summary && (
                <p className="text-xs text-muted-foreground truncate">{summary}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
