import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { fr } from '@/i18n/fr';
import DestinationDocPanel from './DestinationDocPanel';
import type {
  OutboundWebhookDestination,
  WebhookProvider,
  SegmentKey,
} from '@/lib/types/webhook-destinations';

export interface DestinationFormPayload {
  name: string;
  destination_url: string;
  provider: WebhookProvider;
  is_active: boolean;
  trigger_segments: SegmentKey[];
  trigger_churn_threshold: number | null;
  secret_header_name: string | null;
  secret_header_value: string | null;
}

interface FormState {
  name: string;
  provider: WebhookProvider;
  destination_url: string;
  trigger_segments: SegmentKey[];
  churn_threshold: string;
  secret_header_name: string;
  secret_header_value: string;
}

interface FormErrors {
  name?: string;
  destination_url?: string;
  triggers?: string;
}

const ALL_SEGMENTS: SegmentKey[] = [
  'champions', 'expanding', 'stable', 'at_risk',
  'critical', 'past_due', 'churned', 'new',
];

const ALL_PROVIDERS: WebhookProvider[] = [
  'brevo', 'mailchimp', 'lemlist', 'activecampaign', 'slack', 'custom',
];

const PROVIDER_ICONS: Record<WebhookProvider, string> = {
  brevo: '📧',
  mailchimp: '🦁',
  lemlist: '📬',
  activecampaign: '⚡',
  slack: '💬',
  custom: '🔗',
};

function urlPlaceholder(provider: WebhookProvider): string {
  if (provider === 'brevo') return fr.destinations.form.urlPlaceholders.brevo;
  if (provider === 'slack') return fr.destinations.form.urlPlaceholders.slack;
  return fr.destinations.form.urlPlaceholders.default;
}

function initForm(dest?: OutboundWebhookDestination): FormState {
  if (!dest) {
    return {
      name: '',
      provider: 'brevo',
      destination_url: '',
      trigger_segments: [],
      churn_threshold: '',
      secret_header_name: '',
      secret_header_value: '',
    };
  }
  return {
    name: dest.name,
    provider: dest.provider,
    destination_url: dest.destination_url,
    trigger_segments: dest.trigger_segments,
    churn_threshold: dest.trigger_churn_threshold !== null
      ? String(dest.trigger_churn_threshold)
      : '',
    secret_header_name: dest.secret_header_name ?? '',
    secret_header_value: '',
  };
}

interface Props {
  destination?: OutboundWebhookDestination;
  onSave: (payload: DestinationFormPayload) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export default function DestinationForm({ destination, onSave, onCancel, isSaving }: Props) {
  const [form, setForm] = useState<FormState>(() => initForm(destination));
  const [errors, setErrors] = useState<FormErrors>({});

  const toggleSegment = (seg: SegmentKey) => {
    setForm((f) => ({
      ...f,
      trigger_segments: f.trigger_segments.includes(seg)
        ? f.trigger_segments.filter((s) => s !== seg)
        : [...f.trigger_segments, seg],
    }));
  };

  const validate = (): boolean => {
    const e: FormErrors = {};

    if (!form.name.trim()) {
      e.name = fr.destinations.form.errors.nameRequired;
    }
    if (!form.destination_url.trim()) {
      e.destination_url = fr.destinations.form.errors.urlRequired;
    } else if (!form.destination_url.startsWith('https://')) {
      e.destination_url = fr.destinations.form.errors.urlInvalid;
    }

    const hasSegment = form.trigger_segments.length > 0;
    const hasThreshold = form.churn_threshold.trim() !== '';

    if (!hasSegment && !hasThreshold) {
      e.triggers = fr.destinations.form.errors.triggerRequired;
    } else if (hasThreshold) {
      const n = parseInt(form.churn_threshold, 10);
      if (isNaN(n) || n < 0 || n > 100) {
        e.triggers = fr.destinations.form.errors.churnThresholdInvalid;
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const threshold = form.churn_threshold.trim() !== ''
      ? parseInt(form.churn_threshold, 10)
      : null;

    onSave({
      name: form.name.trim(),
      destination_url: form.destination_url.trim(),
      provider: form.provider,
      is_active: destination?.is_active ?? true,
      trigger_segments: form.trigger_segments,
      trigger_churn_threshold: threshold,
      secret_header_name: form.secret_header_name.trim() || null,
      secret_header_value: form.secret_header_value.trim() || null,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 max-h-[70vh] overflow-y-auto pr-1">
      {/* Form fields */}
      <div className="lg:col-span-3 space-y-4">
        {/* Nom */}
        <div className="space-y-1.5">
          <Label htmlFor="dest-name">{fr.destinations.form.name}</Label>
          <Input
            id="dest-name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder={fr.destinations.form.namePlaceholder}
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
        </div>

        {/* Provider */}
        <div className="space-y-1.5">
          <Label>{fr.destinations.form.provider}</Label>
          <Select
            value={form.provider}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, provider: v as WebhookProvider, destination_url: '' }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALL_PROVIDERS.map((p) => (
                <SelectItem key={p} value={p}>
                  {PROVIDER_ICONS[p]} {fr.destinations.providers[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* URL */}
        <div className="space-y-1.5">
          <Label htmlFor="dest-url">{fr.destinations.form.url}</Label>
          <Input
            id="dest-url"
            value={form.destination_url}
            onChange={(e) => setForm((f) => ({ ...f, destination_url: e.target.value }))}
            placeholder={urlPlaceholder(form.provider)}
          />
          {errors.destination_url && (
            <p className="text-xs text-red-500">{errors.destination_url}</p>
          )}
        </div>

        {/* Déclencheurs */}
        <div className="space-y-3">
          <Label>{fr.destinations.form.triggers}</Label>

          <div className="grid grid-cols-2 gap-2">
            {ALL_SEGMENTS.map((seg) => (
              <div key={seg} className="flex items-center gap-2">
                <Checkbox
                  id={`seg-${seg}`}
                  checked={form.trigger_segments.includes(seg)}
                  onCheckedChange={() => toggleSegment(seg)}
                />
                <label htmlFor={`seg-${seg}`} className="text-sm cursor-pointer select-none">
                  {fr.destinations.segments[seg]}
                </label>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {fr.destinations.form.churnThresholdLabel}
            </span>
            <Input
              type="number"
              min={0}
              max={100}
              value={form.churn_threshold}
              onChange={(e) => setForm((f) => ({ ...f, churn_threshold: e.target.value }))}
              className="w-20"
              placeholder="80"
            />
            <span className="text-sm text-muted-foreground">
              {fr.destinations.form.churnThresholdSuffix}
            </span>
          </div>

          {errors.triggers && <p className="text-xs text-red-500">{errors.triggers}</p>}
        </div>

        {/* Auth — accordéon fermé par défaut */}
        <Accordion type="single" collapsible>
          <AccordionItem value="auth" className="border rounded-lg px-3">
            <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
              {fr.destinations.form.authTitle}
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-3">
              <div className="space-y-1.5">
                <Label htmlFor="header-name">{fr.destinations.form.headerName}</Label>
                <Input
                  id="header-name"
                  value={form.secret_header_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, secret_header_name: e.target.value }))
                  }
                  placeholder={fr.destinations.form.headerNamePlaceholder}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="header-value">{fr.destinations.form.headerValue}</Label>
                <Input
                  id="header-value"
                  type="password"
                  value={form.secret_header_value}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, secret_header_value: e.target.value }))
                  }
                  placeholder={destination ? '••••••••' : ''}
                />
                {destination && (
                  <p className="text-xs text-muted-foreground">
                    Laissez vide pour conserver la valeur existante.
                  </p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-border/50">
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            {fr.destinations.form.cancel}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {fr.destinations.form.save}
          </Button>
        </div>
      </div>

      {/* Doc panel */}
      <div className="lg:col-span-2">
        <DestinationDocPanel provider={form.provider} />
      </div>
    </div>
  );
}
