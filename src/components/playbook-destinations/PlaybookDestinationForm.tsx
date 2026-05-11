import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useT } from '@/lib/i18n/useT';
import type {
  PlaybookDestination,
  PlaybookConnector,
  TriggerSegment,
  CreatePlaybookDestinationPayload,
  UpdatePlaybookDestinationPayload,
} from '@/lib/types/playbook-destination';

const CONNECTORS: PlaybookConnector[] = [
  'brevo', 'lemlist', 'activecampaign', 'mailchimp', 'hubspot', 'slack', 'custom',
];

const TRIGGER_SEGMENTS: TriggerSegment[] = [
  'champions', 'en_expansion', 'stables', 'a_risque_leger',
  'en_danger_critique', 'impayes', 'en_churn', 'nouveaux',
];

const ENDPOINT_REQUIRED: PlaybookConnector[] = ['slack', 'activecampaign', 'custom'];

const MESSAGE_VARS = [
  '{{stripe_customer_id}}',
  '{{segment}}',
  '{{churn_risk}}',
  '{{mrr_eur}}',
  '{{health_score}}',
];

export type DestinationFormPayload =
  | Omit<CreatePlaybookDestinationPayload, 'organization_id'>
  | ({ id: string } & UpdatePlaybookDestinationPayload);

interface Props {
  destination?: PlaybookDestination;
  onSave: (payload: DestinationFormPayload) => void;
  onCancel: () => void;
  isSaving: boolean;
}

interface FormState {
  name: string;
  connector: PlaybookConnector;
  is_active: boolean;
  require_approval: boolean;
  trigger_segments: TriggerSegment[];
  trigger_churn_threshold: string;
  trigger_on_invoice_past_due: boolean;
  api_key_vault_key: string;
  api_endpoint: string;
  template_id: string;
  message_template: string;
}

function initState(dest?: PlaybookDestination): FormState {
  return {
    name: dest?.name ?? '',
    connector: dest?.connector ?? 'brevo',
    is_active: dest?.is_active ?? true,
    require_approval: dest?.require_approval ?? false,
    trigger_segments: dest?.trigger_segments ?? [],
    trigger_churn_threshold: dest?.trigger_churn_threshold !== null
      ? String(dest?.trigger_churn_threshold ?? '')
      : '',
    trigger_on_invoice_past_due: dest?.trigger_on_invoice_past_due ?? false,
    api_key_vault_key: '',
    api_endpoint: dest?.api_endpoint ?? '',
    template_id: dest?.template_id ?? '',
    message_template: dest?.message_template ?? '',
  };
}

export default function PlaybookDestinationForm({ destination, onSave, onCancel, isSaving }: Props) {
  const fr = useT();
  const [form, setForm] = useState<FormState>(() => initState(destination));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const t = fr.playbookDestinations;
  const tf = t.form;
  const isEdit = !!destination;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const toggleSegment = (seg: TriggerSegment) => {
    setForm((prev) => {
      const has = prev.trigger_segments.includes(seg);
      return {
        ...prev,
        trigger_segments: has
          ? prev.trigger_segments.filter((s) => s !== seg)
          : [...prev.trigger_segments, seg],
      };
    });
    setErrors((prev) => ({ ...prev, triggers: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) {
      newErrors.name = tf.validationName;
    }

    const hasTrigger =
      form.trigger_segments.length > 0 ||
      (form.trigger_churn_threshold !== '' && !isNaN(Number(form.trigger_churn_threshold))) ||
      form.trigger_on_invoice_past_due;

    if (!hasTrigger) {
      newErrors.triggers = tf.validationTrigger;
    }

    if (
      ENDPOINT_REQUIRED.includes(form.connector) &&
      !form.api_endpoint.trim()
    ) {
      newErrors.api_endpoint = tf.apiEndpointRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const threshold =
      form.trigger_churn_threshold !== ''
        ? Number(form.trigger_churn_threshold)
        : null;

    if (isEdit) {
      const payload: { id: string } & UpdatePlaybookDestinationPayload = {
        id: destination.id,
        name: form.name.trim(),
        connector: form.connector,
        is_active: form.is_active,
        require_approval: form.require_approval,
        trigger_segments: form.trigger_segments,
        trigger_churn_threshold: threshold,
        trigger_on_invoice_past_due: form.trigger_on_invoice_past_due,
        api_endpoint: form.api_endpoint.trim() || null,
        template_id: form.template_id.trim() || null,
        message_template: form.message_template.trim() || null,
      };
      if (form.api_key_vault_key.trim()) {
        payload.api_key_vault_key = form.api_key_vault_key.trim();
      }
      onSave(payload);
    } else {
      const payload: Omit<CreatePlaybookDestinationPayload, 'organization_id'> = {
        name: form.name.trim(),
        connector: form.connector,
        is_active: form.is_active,
        require_approval: form.require_approval,
        trigger_segments: form.trigger_segments,
        trigger_churn_threshold: threshold,
        trigger_on_invoice_past_due: form.trigger_on_invoice_past_due,
        api_key_vault_key: form.api_key_vault_key.trim() || null,
        api_endpoint: form.api_endpoint.trim() || null,
        template_id: form.template_id.trim() || null,
        message_template: form.message_template.trim() || null,
      };
      onSave(payload);
    }
  };

  return (
    <div className="space-y-6 py-2">
      {/* Nom + Connecteur + Toggle */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="dest-name">{tf.name} *</Label>
          <Input
            id="dest-name"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder={tf.namePlaceholder}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>{tf.connector}</Label>
          <Select
            value={form.connector}
            onValueChange={(v) => set('connector', v as PlaybookConnector)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONNECTORS.map((c) => (
                <SelectItem key={c} value={c}>
                  {t.connectors[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Toggles actif + validation manuelle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-8">
        <div className="flex items-center gap-3">
          <Switch
            id="dest-active"
            checked={form.is_active}
            onCheckedChange={(v) => set('is_active', v)}
          />
          <Label htmlFor="dest-active">{tf.isActive}</Label>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <Switch
              id="dest-require-approval"
              checked={form.require_approval}
              onCheckedChange={(v) => set('require_approval', v)}
            />
            <Label htmlFor="dest-require-approval">{tf.requireApproval}</Label>
          </div>
          {form.require_approval && (
            <p className="text-xs text-muted-foreground ml-11">{tf.requireApprovalHint}</p>
          )}
        </div>
      </div>

      {/* Déclencheurs */}
      <div className="space-y-3">
        <Label>{tf.triggers} *</Label>
        {errors.triggers && <p className="text-xs text-destructive">{errors.triggers}</p>}

        <div className="space-y-1.5">
          <p className="text-sm text-muted-foreground">{tf.segments}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TRIGGER_SEGMENTS.map((seg) => (
              <label
                key={seg}
                className="flex items-center gap-2 cursor-pointer text-sm"
              >
                <Checkbox
                  checked={form.trigger_segments.includes(seg)}
                  onCheckedChange={() => toggleSegment(seg)}
                />
                {t.segments[seg]}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="dest-churn">{tf.churnThreshold}</Label>
            <Input
              id="dest-churn"
              type="number"
              min={0}
              max={100}
              value={form.trigger_churn_threshold}
              onChange={(e) => set('trigger_churn_threshold', e.target.value)}
              placeholder={tf.churnThresholdPlaceholder}
            />
            <p className="text-xs text-muted-foreground">{tf.churnThresholdHint}</p>
          </div>

          <div className="flex items-center gap-3 pt-6">
            <Checkbox
              id="dest-invoice"
              checked={form.trigger_on_invoice_past_due}
              onCheckedChange={(v) => set('trigger_on_invoice_past_due', v === true)}
            />
            <Label htmlFor="dest-invoice">{tf.invoicePastDue}</Label>
          </div>
        </div>
      </div>

      {/* Clé API */}
      <div className="space-y-1.5">
        <Label htmlFor="dest-apikey">{tf.apiKey}</Label>
        <Input
          id="dest-apikey"
          type="password"
          value={form.api_key_vault_key}
          onChange={(e) => set('api_key_vault_key', e.target.value)}
          placeholder={isEdit ? tf.apiKeyMasked : ''}
          autoComplete="new-password"
        />
        {isEdit && (
          <p className="text-xs text-muted-foreground">{tf.apiKeyHint}</p>
        )}
      </div>

      {/* Endpoint (conditionnel) */}
      {ENDPOINT_REQUIRED.includes(form.connector) && (
        <div className="space-y-1.5">
          <Label htmlFor="dest-endpoint">{tf.apiEndpoint}</Label>
          <Input
            id="dest-endpoint"
            type="url"
            value={form.api_endpoint}
            onChange={(e) => set('api_endpoint', e.target.value)}
            placeholder={tf.apiEndpointPlaceholder}
          />
          {errors.api_endpoint && (
            <p className="text-xs text-destructive">{errors.api_endpoint}</p>
          )}
        </div>
      )}

      {/* Template ID */}
      <div className="space-y-1.5">
        <Label htmlFor="dest-template">{tf.templateId}</Label>
        <Input
          id="dest-template"
          value={form.template_id}
          onChange={(e) => set('template_id', e.target.value)}
          placeholder={tf.templateIdPlaceholder}
        />
      </div>

      {/* Message template */}
      <div className="space-y-1.5">
        <Label htmlFor="dest-msg">{tf.messageTemplate}</Label>
        <Textarea
          id="dest-msg"
          value={form.message_template}
          onChange={(e) => set('message_template', e.target.value)}
          placeholder={tf.messageTemplatePlaceholder}
          rows={4}
        />
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs text-muted-foreground">{tf.messageTemplateVars} :</span>
          {MESSAGE_VARS.map((v) => (
            <code
              key={v}
              className="text-xs bg-muted px-1.5 py-0.5 rounded cursor-pointer hover:bg-muted/80"
              onClick={() => set('message_template', form.message_template + v)}
            >
              {v}
            </code>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2 border-t">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          {tf.cancel}
        </Button>
        <Button onClick={handleSubmit} disabled={isSaving}>
          {isSaving ? tf.saving : tf.save}
        </Button>
      </div>
    </div>
  );
}
