import DOMPurify from 'dompurify';
import { Card, CardContent } from '@/components/ui/card';
import { useT } from '@/lib/i18n/useT';
import { EMAIL_PREVIEW_DATA } from '@/lib/types/playbook';

interface Props {
  subject: string;
  bodyHtml: string;
}

function replaceVariables(text: string): string {
  return text.replace(/\{\{([^}]+)\}\}/g, (_match, key: string) => {
    return EMAIL_PREVIEW_DATA[key.trim()] ?? `{{${key}}}`;
  });
}

export default function EmailPreview({ subject, bodyHtml }: Props) {
  const fr = useT();
  const previewSubject = replaceVariables(subject || '(no subject)');
  const previewBody = replaceVariables(bodyHtml || '<p style="color:#999">No content</p>');

  return (
    <Card className="border-slate-200 bg-slate-50">
      <CardContent className="p-4 space-y-3">
        <div className="text-xs space-y-1">
          <p>
            <span className="font-semibold text-muted-foreground">{fr.workflows.emailPreviewFrom} </span>
            <span>noreply@sentio.ai</span>
          </p>
          <p>
            <span className="font-semibold text-muted-foreground">{fr.workflows.emailPreviewSubject} </span>
            <span>{previewSubject}</span>
          </p>
        </div>
        <div className="border-t pt-3">
          <div
            className="prose prose-sm max-w-none text-sm"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewBody) }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
