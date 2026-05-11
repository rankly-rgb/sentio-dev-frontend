import { Badge } from '@/components/ui/badge';
import { useT } from '@/lib/i18n/useT';
import type { PlaybookStatus } from '@/lib/types/playbook';

interface Props {
  status: PlaybookStatus;
  className?: string;
}

export default function PlaybookStatusBadge({ status, className }: Props) {
  const fr = useT();
  const statusConfig: Record<PlaybookStatus, { label: string; className: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    draft: { label: fr.playbooks.status.draft, className: '', variant: 'outline' },
    active: { label: fr.playbooks.status.active, className: 'bg-emerald-500 text-white border-transparent hover:bg-emerald-500/80', variant: 'default' },
    paused: { label: fr.playbooks.status.paused, className: 'bg-amber-500 text-white border-transparent hover:bg-amber-500/80', variant: 'default' },
    completed: { label: fr.playbooks.status.completed, className: 'bg-indigo-500 text-white border-transparent hover:bg-indigo-500/80', variant: 'default' },
    archived: { label: fr.playbooks.status.archived, className: 'opacity-60', variant: 'outline' },
  };
  const config = statusConfig[status] ?? statusConfig.draft;
  return (
    <Badge variant={config.variant} className={`${config.className} ${className ?? ''}`}>
      {config.label}
    </Badge>
  );
}
