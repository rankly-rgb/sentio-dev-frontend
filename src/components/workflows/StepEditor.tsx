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
import EmailStepEditor from './EmailStepEditor';
import { ActionConfigFields } from '@/components/playbooks/ActionEditor';
import type { WorkflowStep, ActionType } from '@/lib/types/playbook';

const ALL_ACTION_TYPES: ActionType[] = [
  'slack_notify',
  'create_task',
  'assign_owner',
  'update_tag',
  'log_note',
  'schedule_review',
  'flag_for_review',
  'send_email',
];

function defaultStepConfig(type: ActionType): Record<string, unknown> {
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

interface Props {
  steps: WorkflowStep[];
  onChange: (steps: WorkflowStep[]) => void;
}

export default function StepEditor({ steps, onChange }: Props) {
  const addStep = () => {
    const newStep: WorkflowStep = {
      step_order: steps.length + 1,
      delay_days: 0,
      action_type: 'create_task',
      title: '',
      config: defaultStepConfig('create_task'),
    };
    onChange([...steps, newStep]);
  };

  const removeStep = (idx: number) => {
    const updated = steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, step_order: i + 1 }));
    onChange(updated);
  };

  const updateStep = (idx: number, patch: Partial<WorkflowStep>) => {
    const updated = steps.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    onChange(updated);
  };

  const changeActionType = (idx: number, type: ActionType) => {
    updateStep(idx, { action_type: type, config: defaultStepConfig(type) });
  };

  const moveStep = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= steps.length) return;
    const updated = [...steps];
    [updated[idx], updated[target]] = [updated[target], updated[idx]];
    onChange(updated.map((s, i) => ({ ...s, step_order: i + 1 })));
  };

  return (
    <div className="space-y-4">
      {steps.map((step, idx) => (
        <div key={idx} className="border rounded-lg p-4 space-y-3">
          {/* Step header */}
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
              {idx + 1}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {fr.workflows.step} {idx + 1}
            </span>
            <div className="ml-auto flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={idx === 0}
                onClick={() => moveStep(idx, -1)}
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={idx === steps.length - 1}
                onClick={() => moveStep(idx, 1)}
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={() => removeStep(idx)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Title + Delay */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="text-xs font-medium">{fr.workflows.stepTitle}</label>
              <Input
                value={step.title}
                onChange={(e) => updateStep(idx, { title: e.target.value })}
                placeholder={fr.workflows.stepTitle}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium">{fr.workflows.delayDays}</label>
              <Input
                type="number"
                min={0}
                value={step.delay_days}
                onChange={(e) => updateStep(idx, { delay_days: Number(e.target.value) })}
                className="mt-1"
              />
            </div>
          </div>

          {/* Action type */}
          <div>
            <label className="text-xs font-medium">{fr.workflows.stepAction}</label>
            <Select value={step.action_type} onValueChange={(v) => changeActionType(idx, v as ActionType)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_ACTION_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {fr.playbooks.actionType[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Config */}
          {step.action_type === 'send_email' ? (
            <EmailStepEditor
              config={step.config}
              onChange={(config) => updateStep(idx, { config })}
            />
          ) : (
            <ActionConfigFields
              type={step.action_type}
              config={step.config}
              onChange={(config) => updateStep(idx, { config })}
            />
          )}
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addStep}>
        <Plus className="h-4 w-4 mr-2" />
        {fr.workflows.addStep}
      </Button>
    </div>
  );
}
