import { useState } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useT } from '@/lib/i18n/useT';
import EmailStepEditor from '@/components/workflows/EmailStepEditor';
import { useIntegrationStatus } from '@/hooks/useIntegrations';
import type { PlaybookAction, ActionType } from '@/lib/types/playbook';

const ACTION_TYPES: ActionType[] = [
  'slack_notify',
  'create_task',
  'send_email_hubspot',
  'hubspot_enroll_sequence',
  'hubspot_update_company',
  'assign_owner',
  'update_tag',
  'log_note',
  'schedule_review',
  'flag_for_review',
  'send_email',
];

const ACTIVE_ACTIONS: ReadonlySet<string> = new Set([
  'slack_notify',
  'create_task',
  'send_email_hubspot',
  'hubspot_enroll_sequence',
  'hubspot_update_company',
  'flag_for_review',
  'log_note',
]);

const SLACK_VARIABLES = [
  '{stripe_customer_id}',
  '{mrr_eur}',
  '{churn_risk}',
  '{health_score}',
  '{playbook}',
];

function defaultConfig(type: ActionType): Record<string, unknown> {
  switch (type) {
    case 'slack_notify': return { channel: '', message: '' };
    case 'create_task': return { title: '', due_days: 3 };
    case 'send_email_hubspot': return { subject: '', body_html: '' };
    case 'assign_owner': return { role: '' };
    case 'update_tag': return { tag: '' };
    case 'log_note': return { title: '', body: '' };
    case 'schedule_review': return { review_days: 7 };
    case 'flag_for_review': return { flag: 'review_needed', reason: 'Flagged by playbook' };
    case 'send_email': return { recipient_field: 'account_email', subject: '', body_html: '' };
    case 'hubspot_enroll_sequence': return { sequence_id: '', sender_id: '' };
    case 'hubspot_update_company': return { properties: {} };
    default: return {};
  }
}

const HUBSPOT_EMAIL_VARIABLES = [
  '{stripe_customer_id}',
  '{health_score}',
  '{churn_risk}',
  '{expansion_score}',
  '{mrr_eur}',
  '{playbook}',
];

function PropertyEditor({
  config,
  onChange,
  hubspotConnected,
}: {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
  hubspotConnected?: boolean;
}) {
  const fr = useT();
  const rawProperties = (config.properties ?? {}) as Record<string, string>;
  const [pairs, setPairs] = useState<{ key: string; value: string }[]>(() => {
    const entries = Object.entries(rawProperties);
    return entries.length > 0 ? entries.map(([key, value]) => ({ key, value })) : [{ key: '', value: '' }];
  });

  const commit = (newPairs: { key: string; value: string }[]) => {
    setPairs(newPairs);
    const properties: Record<string, string> = {};
    for (const { key, value } of newPairs) {
      if (key.trim()) properties[key.trim()] = value;
    }
    onChange({ ...config, properties });
  };

  const updatePair = (idx: number, field: 'key' | 'value', val: string) => {
    commit(pairs.map((p, i) => (i === idx ? { ...p, [field]: val } : p)));
  };

  const addPair = () => commit([...pairs, { key: '', value: '' }]);

  const removePair = (idx: number) => {
    const next = pairs.filter((_, i) => i !== idx);
    commit(next.length > 0 ? next : [{ key: '', value: '' }]);
  };

  const hasNonEmptyPair = pairs.some(p => p.key.trim() !== '');
  const hasEmptyKey = pairs.some(p => p.key.trim() === '' && pairs.length > 1);

  return (
    <div className="space-y-2">
      {hubspotConnected !== undefined && !hubspotConnected && (
        <div className="flex items-start gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
          <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
          <span>{fr.playbooks.form.hubspotNotConnectedWarning}</span>
        </div>
      )}
      <div className="space-y-1.5">
        {pairs.map((pair, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <Input
              placeholder={fr.playbooks.form.hubspotPropertyKey}
              value={pair.key}
              onChange={e => updatePair(idx, 'key', e.target.value)}
              className={pair.key === '' && pairs.length > 1 ? 'border-amber-400' : ''}
            />
            <Input
              placeholder={fr.playbooks.form.hubspotPropertyValue}
              value={pair.value}
              onChange={e => updatePair(idx, 'value', e.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-destructive"
              onClick={() => removePair(idx)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={addPair}>
        <Plus className="h-3.5 w-3.5 mr-1.5" />
        {fr.playbooks.form.hubspotAddProperty}
      </Button>
      {!hasNonEmptyPair && (
        <p className="text-xs text-destructive">{fr.playbooks.form.hubspotPropertiesRequired}</p>
      )}
      {hasEmptyKey && (
        <p className="text-xs text-amber-600">{fr.playbooks.form.hubspotPropertyKeyRequired}</p>
      )}
      <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <Info className="h-3 w-3 mt-0.5 shrink-0" />
        <span>{fr.playbooks.form.hubspotUpdateHint}</span>
      </div>
    </div>
  );
}

export function ActionConfigFields({
  type,
  config,
  onChange,
  slackConnected,
  hubspotConnected,
}: {
  type: ActionType;
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
  slackConnected?: boolean;
  hubspotConnected?: boolean;
}) {
  const fr = useT();
  const update = (key: string, value: unknown) => onChange({ ...config, [key]: value });

  switch (type) {
    case 'slack_notify':
      return (
        <div className="space-y-2">
          {/* Slack connection indicator */}
          {slackConnected !== undefined && (
            slackConnected ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                <CheckCircle className="h-3 w-3" />
                {fr.integrations.slack.slackConnectedIndicator}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-amber-600">
                <AlertTriangle className="h-3 w-3" />
                {fr.integrations.slack.slackNotConnectedIndicator}
              </div>
            )
          )}
          <Input
            placeholder={fr.playbooks.form.slackChannel}
            value={String(config.channel ?? '')}
            onChange={(e) => update('channel', e.target.value)}
          />
          <Textarea
            placeholder={fr.playbooks.form.slackMessage}
            value={String(config.message ?? config.template ?? '')}
            onChange={(e) => update('message', e.target.value)}
            rows={3}
          />
          <div className="flex flex-wrap gap-1">
            <span className="text-xs text-muted-foreground mr-1">{fr.playbooks.form.variables} :</span>
            {SLACK_VARIABLES.map((v) => (
              <Badge
                key={v}
                variant="outline"
                className="text-[10px] cursor-pointer hover:bg-primary/10"
                onClick={() => update('message', `${String(config.message ?? '')}${v}`)}
              >
                {v}
              </Badge>
            ))}
          </div>
        </div>
      );
    case 'create_task':
      return (
        <div className="space-y-2">
          {hubspotConnected !== undefined && !hubspotConnected && (
            <div className="flex items-start gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
              <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
              <span>{fr.playbooks.form.hubspotNotConnectedWarning}</span>
            </div>
          )}
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
          <p className="text-xs text-muted-foreground">{fr.playbooks.form.hubspotRequired}</p>
        </div>
      );
    case 'send_email_hubspot':
      return (
        <div className="space-y-2">
          {hubspotConnected !== undefined && !hubspotConnected && (
            <div className="flex items-start gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
              <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
              <span>{fr.playbooks.form.hubspotNotConnectedWarning}</span>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-muted-foreground">{fr.playbooks.form.emailHubspotSubject}</label>
            <Input
              placeholder={fr.playbooks.form.emailHubspotSubjectPlaceholder}
              value={String(config.subject ?? '')}
              onChange={(e) => update('subject', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">{fr.playbooks.form.emailHubspotBody}</label>
            <Textarea
              placeholder={fr.playbooks.form.emailHubspotBodyPlaceholder}
              value={String(config.body_html ?? '')}
              onChange={(e) => update('body_html', e.target.value)}
              rows={4}
            />
          </div>
          <div className="flex flex-wrap gap-1">
            <span className="text-xs text-muted-foreground mr-1">{fr.playbooks.form.variables} :</span>
            {HUBSPOT_EMAIL_VARIABLES.map((v) => (
              <Badge
                key={v}
                variant="outline"
                className="text-[10px] cursor-pointer hover:bg-primary/10"
                onClick={() => update('body_html', `${String(config.body_html ?? '')}${v}`)}
              >
                {v}
              </Badge>
            ))}
          </div>
          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <Info className="h-3 w-3 mt-0.5 shrink-0" />
            <span>{fr.playbooks.form.emailHubspotDefaultHint}</span>
          </div>
          <p className="text-xs text-muted-foreground">{fr.playbooks.form.emailHubspotPrerequisite}</p>
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
        <div className="space-y-2">
          <Input
            placeholder={fr.playbooks.form.noteTitle}
            value={String(config.title ?? '')}
            onChange={(e) => update('title', e.target.value)}
          />
          <Textarea
            placeholder={fr.playbooks.form.noteBody}
            value={String(config.body ?? config.note ?? '')}
            onChange={(e) => update('body', e.target.value)}
            rows={2}
          />
          <p className="text-xs text-muted-foreground">{fr.playbooks.form.noteDefaultHint}</p>
        </div>
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
    case 'flag_for_review':
      return (
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder={fr.playbooks.form.flagName}
            value={String(config.flag ?? 'review_needed')}
            onChange={(e) => update('flag', e.target.value)}
          />
          <Input
            placeholder={fr.playbooks.form.flagReason}
            value={String(config.reason ?? '')}
            onChange={(e) => update('reason', e.target.value)}
          />
        </div>
      );
    case 'send_email':
      return <EmailStepEditor config={config} onChange={onChange} />;
    case 'hubspot_enroll_sequence': {
      const sequenceId = String(config.sequence_id ?? '');
      const senderId = String(config.sender_id ?? '');
      const senderIdInvalid = senderId !== '' && !/^\d+$/.test(senderId);
      return (
        <div className="space-y-2">
          {hubspotConnected !== undefined && !hubspotConnected && (
            <div className="flex items-start gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
              <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
              <span>{fr.playbooks.form.hubspotNotConnectedWarning}</span>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-muted-foreground">{fr.playbooks.form.sequenceId}</label>
            <Input
              placeholder={fr.playbooks.form.sequenceIdPlaceholder}
              value={sequenceId}
              onChange={e => update('sequence_id', e.target.value)}
            />
            {sequenceId === '' && (
              <p className="text-xs text-destructive mt-0.5">{fr.playbooks.form.fieldRequired}</p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">{fr.playbooks.form.senderId}</label>
            <Input
              placeholder={fr.playbooks.form.senderIdPlaceholder}
              value={senderId}
              onChange={e => update('sender_id', e.target.value)}
            />
            {senderId === '' && (
              <p className="text-xs text-destructive mt-0.5">{fr.playbooks.form.fieldRequired}</p>
            )}
            {senderIdInvalid && (
              <p className="text-xs text-destructive mt-0.5">{fr.playbooks.form.senderIdNumeric}</p>
            )}
          </div>
          <div className="flex items-start gap-1.5 text-xs text-muted-foreground bg-blue-50 border border-blue-100 rounded p-2">
            <Info className="h-3 w-3 mt-0.5 shrink-0 text-blue-500" />
            <span>{fr.playbooks.form.senderIdHint}</span>
          </div>
        </div>
      );
    }
    case 'hubspot_update_company':
      return (
        <PropertyEditor
          config={config}
          onChange={onChange}
          hubspotConnected={hubspotConnected}
        />
      );
    default:
      return null;
  }
}

interface Props {
  actions: PlaybookAction[];
  onChange: (actions: PlaybookAction[]) => void;
  isWorkflow?: boolean;
}

export default function ActionEditor({ actions, onChange, isWorkflow = false }: Props) {
  const fr = useT();
  const { data: integrationStatus } = useIntegrationStatus();
  const slackConnected = integrationStatus?.slack?.connected;
  const hubspotConnected = integrationStatus?.hubspot?.connected;

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
      {actions.map((action, idx) => {
        const isActive = ACTIVE_ACTIONS.has(action.type);
        return (
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
                  {ACTION_TYPES.filter((t) => {
                    // V2 - HubSpot/Slack : masqués en V1 (code conservé pour V2)
                    if (['slack_notify', 'send_email_hubspot', 'hubspot_enroll_sequence', 'hubspot_update_company'].includes(t)) return false;
                    return t !== 'send_email' || isWorkflow;
                  }).map((t) => (
                    <SelectItem key={t} value={t}>
                      {fr.playbooks.actionType[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge
                variant={isActive ? 'default' : 'secondary'}
                className={isActive
                  ? 'bg-green-100 text-green-800 hover:bg-green-100 text-[10px] px-1.5 py-0'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-100 text-[10px] px-1.5 py-0'}
              >
                {isActive ? fr.playbooks.actionStatusActive : fr.playbooks.actionStatusSoon}
              </Badge>
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
              slackConnected={action.type === 'slack_notify' ? slackConnected : undefined}
              hubspotConnected={
                action.type === 'send_email_hubspot' ||
                action.type === 'create_task' ||
                action.type === 'hubspot_enroll_sequence' ||
                action.type === 'hubspot_update_company'
                  ? hubspotConnected
                  : undefined
              }
            />
          </div>
        );
      })}
      <Button type="button" variant="outline" size="sm" onClick={addAction}>
        <Plus className="h-4 w-4 mr-2" />
        {fr.playbooks.form.addAction}
      </Button>
    </div>
  );
}
