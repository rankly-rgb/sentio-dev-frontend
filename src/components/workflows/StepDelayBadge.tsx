import { Badge } from '@/components/ui/badge';
import { fr } from '@/i18n/fr';

interface Props {
  delayDays: number;
}

export default function StepDelayBadge({ delayDays }: Props) {
  const colorClass = delayDays === 0
    ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
    : 'text-blue-600 bg-blue-50 border-blue-200';

  return (
    <Badge variant="outline" className={`text-xs font-mono ${colorClass}`}>
      {fr.workflows.dayPrefix}{delayDays}
    </Badge>
  );
}
