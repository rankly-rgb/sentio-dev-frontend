import { Badge } from '@/components/ui/badge';
import { useT } from '@/lib/i18n/useT';
import type { PlaybookPriority } from '@/lib/types/playbook';

interface Props {
  priority: PlaybookPriority;
  className?: string;
}

export default function PriorityBadge({ priority, className }: Props) {
  const fr = useT();
  const priorityConfig: Record<PlaybookPriority, { label: string; className: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    low: { label: fr.playbooks.priority.low, className: '', variant: 'outline' },
    medium: { label: fr.playbooks.priority.medium, className: 'bg-blue-500 text-white border-transparent hover:bg-blue-500/80', variant: 'default' },
    high: { label: fr.playbooks.priority.high, className: 'bg-amber-500 text-white border-transparent hover:bg-amber-500/80', variant: 'default' },
    critical: { label: fr.playbooks.priority.critical, className: '', variant: 'destructive' },
  };
  const config = priorityConfig[priority] ?? priorityConfig.medium;
  return (
    <Badge variant={config.variant} className={`${config.className} ${className ?? ''}`}>
      {config.label}
    </Badge>
  );
}
