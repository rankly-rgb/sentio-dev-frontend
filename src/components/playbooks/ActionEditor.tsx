import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fr } from '@/i18n/fr';
import EmailStepEditor from '@/components/workflows/EmailStepEditor';
import type { PlaybookAction, ActionType } from '@/lib/types/playbook';

const ACTION_TYPES: ActionType[] = [
  'slack_notify',
  'create_task',
  'assign_owner',
  'update_tag',
  'log_note',
  'schedule_review',
  'flag_for_review',
  'send_email',
];

function defaultConfig(type: ActionType): Record<string, unknown> {
  switch (type) {
    case 'slack_notify': return { channel: '', template: '' };
    case 'create_task': return { title: '', due_days: 3 };
    case 'assign_owner': return { role: '' };
    case 'update_tag': return { tag: '' };
    case 'log_note': return { note: '' };
    case 'schedule_review': return { review_days: 7 };
    case 'flag_for_review': return {};
    case 'send_email': return { recipient_field: 'account_email', subject: '', body_html: '' };
    default: return {};
  }
}

export function ActionConfigFields({
  type,
  config,
  onChange,
}: {
  type: ActionType;
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}) {
  const update = (key: string, value: unknown) => onChange({ ...config, [key]: value });

  switch (type) {
    case 'slack_notify':
      return (
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder={fr.playbooks.form.channel}
            value={String(config.channel ?? '')}
            onChange={(e) => update('channel', e.target.value)}
          />
          <Input
            placeholder={fr.playbooks.form.template}
            value={String(config.template ?? '')}
            onChange={(e) => update('template', e.target.value)}
          />
        </div>
      );
    case 'create_task':
      return (
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder={fr.playbooks.form.taskTitle}
            value={String(config.title ?? '')}
            onChange={(e) => update('title', e.target.value)}
          />
          <Input
            type="number"
            placeholder={fr.playbooks.form.dueDays}
            value={String(config.due_days ?? '')}
            onChange={(e) => update('due_days', Number(e.target.value))}
          />
        </div>
      );
    case 'assign_owner':
      return (
        <Input
          placeholder={fr.playbooks.form.role}
          value={String(config.role ?? '')}
          onChange={(e) => update('role', e.target.value)}
        />
      );
    case 'update_tag':
      return (
        <Input
          placeholder={fr.playbooks.form.tag}
          value={String(config.tag ?? '')}
          onChange={(e) => update('tag', e.target.value)}
        />
      );
    case 'log_note':
      return (
        <Input
          placeholder={fr.playbooks.form.note}
          value={String(config.note ?? '')}
          onChange={(e) => update('note', e.target.value)}
        />
      );
    case 'schedule_review':
      return (
        <Input
          type="number"
          placeholder={fr.playbooks.form.reviewDays}
          value={String(config.review_days ?? '')}
          onChange={(e) => update('review_days', Number(e.target.value))}
        />
      );
    case 'send_email':
      return <EmailStepEditor config={config} onChange={onChange} />;
    case 'flag_for_review':
      return null;
    default:
      return null;
  }
}

interface Props {
  actions: PlaybookAction[];
  onChange: (actions: PlaybookAction[]) => void;
}

export default function ActionEditor({ actions, onChange }: Props) {
  const addAction = () => {
    const newAction: PlaybookAction = {
      type: 'create_task',
      config: defaultConfig('create_task'),
      order: actions.length + 1,
    };
    onChange([...actions, newAction]);
  };

  const removeAction = (idx: number) => {
    const updated = actions.filter((_, i) => i !== idx).map((a, i) => ({ ...a, order: i + 1 }));
    onChange(updated);
  };

  const updateAction = (idx: number, patch: Partial<PlaybookAction>) => {
    const updated = actions.map((a, i) => (i === idx ? { ...a, ...patch } : a));
    onChange(updated);
  };

  const changeType = (idx: number, type: ActionType) => {
    updateAction(idx, { type, config: defaultConfig(type) });
  };

  const moveAction = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= actions.length) return;
    const updated = [...actions];
    [updated[idx], updated[target]] = [updated[target], updated[idx]];
    onChange(updated.map((a, i) => ({ ...a, order: i + 1 })));
  };

  return (
    <div className="space-y-3">
      {actions.map((action, idx) => (
        <div key={idx} className="border rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground w-6 text-center">
              {idx + 1}
            </span>
            <Select value={action.type} onValueChange={(v) => changeType(idx, v as ActionType)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTION_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {fr.playbooks.actionType[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="ml-auto flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={idx === 0}
                onClick={() => moveAction(idx, -1)}
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={idx === actions.length - 1}
                onClick={() => moveAction(idx, 1)}
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={() => removeAction(idx)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <ActionConfigFields
            type={action.type}
            config={action.config}
            onChange={(config) => updateAction(idx, { config })}
          />
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addAction}>
        <Plus className="h-4 w-4 mr-2" />
        {fr.playbooks.form.addAction}
      </Button>
    </div>
  );
}
