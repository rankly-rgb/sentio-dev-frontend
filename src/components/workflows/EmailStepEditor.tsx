import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fr } from '@/i18n/fr';
import VariableInserter from './VariableInserter';
import EmailPreview from './EmailPreview';

const RECIPIENT_OPTIONS = ['account_email', 'csm_email', 'billing_email'] as const;

interface Props {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export default function EmailStepEditor({ config, onChange }: Props) {
  const [showPreview, setShowPreview] = useState(false);

  const update = (key: string, value: unknown) => onChange({ ...config, [key]: value });

  const insertIntoField = (field: 'email_subject' | 'email_body_html', variable: string) => {
    const current = String(config[field] ?? '');
    update(field, current + variable);
  };

  return (
    <div className="space-y-3">
      {/* Recipient */}
      <div>
        <label className="text-xs font-medium">{fr.workflows.emailRecipient}</label>
        <Select
          value={String(config.recipient_field ?? 'account_email')}
          onValueChange={(v) => update('recipient_field', v)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RECIPIENT_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {fr.workflows.recipientOptions[opt]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Subject */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium">{fr.workflows.emailSubject}</label>
          <VariableInserter onInsert={(v) => insertIntoField('email_subject', v)} />
        </div>
        <Input
          value={String(config.email_subject ?? '')}
          onChange={(e) => update('email_subject', e.target.value)}
          placeholder={fr.workflows.emailSubjectPlaceholder}
        />
      </div>

      {/* Body HTML */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium">{fr.workflows.emailBody}</label>
          <VariableInserter onInsert={(v) => insertIntoField('email_body_html', v)} />
        </div>
        <Textarea
          value={String(config.email_body_html ?? '')}
          onChange={(e) => update('email_body_html', e.target.value)}
          placeholder={fr.workflows.emailBodyPlaceholder}
          rows={6}
          className="font-mono text-xs"
        />
      </div>

      {/* Reply-to */}
      <div>
        <label className="text-xs font-medium">{fr.workflows.emailReplyTo}</label>
        <Input
          value={String(config.reply_to ?? '')}
          onChange={(e) => update('reply_to', e.target.value)}
          placeholder="csm@sentio.ai"
          className="mt-1"
        />
      </div>

      {/* Preview toggle */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="gap-1.5"
        onClick={() => setShowPreview(!showPreview)}
      >
        {showPreview ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        {fr.workflows.emailPreview}
      </Button>

      {showPreview && (
        <EmailPreview
          subject={String(config.email_subject ?? '')}
          bodyHtml={String(config.email_body_html ?? '')}
        />
      )}
    </div>
  );
}
