import { useT } from '@/lib/i18n/useT';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PlaybookDetailPlaybook } from '@/lib/types/playbook';

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2.5 border-b last:border-b-0 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

interface Props {
  playbook: PlaybookDetailPlaybook;
}

export default function PlaybookConfiguration({ playbook }: Props) {
  const fr = useT();
  const categoryLabel =
    fr.playbooks.category[playbook.category as keyof typeof fr.playbooks.category] ??
    playbook.category ??
    '—';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{fr.playbooks.configTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <Row label={fr.playbooks.metaType} value={playbook.execution_type || '—'} />
        <Row label={fr.playbooks.metaCategory} value={categoryLabel} />
        <Row
          label={fr.playbooks.metaAutomated}
          value={playbook.is_automated ? fr.common.yes : fr.common.no}
        />
        <Row
          label={fr.playbooks.metaApproval}
          value={playbook.requires_approval ? fr.common.yes : fr.common.no}
        />
        <Row label={fr.playbooks.metaCreatedAt} value={formatDate(playbook.created_at)} />
      </CardContent>
    </Card>
  );
}
