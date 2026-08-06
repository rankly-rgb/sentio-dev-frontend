import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/useT';
import type { NudgeResponseValue } from '@/lib/types/playbook';

interface Props {
  onRespond: (response: NudgeResponseValue) => void;
  isSubmitting?: boolean;
}

export default function OutcomeNudge({ onRespond, isSubmitting }: Props) {
  const fr = useT();

  return (
    <div className="flex items-center gap-2 flex-wrap rounded-md border border-dashed p-2 text-xs">
      <span className="font-medium">{fr.playbooks.outcomeNudge.question}</span>
      <Button
        size="sm"
        variant="outline"
        className="h-6 px-2 text-xs"
        disabled={isSubmitting}
        onClick={() => onRespond('resolved')}
      >
        <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-500" />
        {fr.playbooks.outcomeNudge.resolved}
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="h-6 px-2 text-xs"
        disabled={isSubmitting}
        onClick={() => onRespond('not_resolved')}
      >
        <XCircle className="h-3 w-3 mr-1 text-destructive" />
        {fr.playbooks.outcomeNudge.notResolved}
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="h-6 px-2 text-xs"
        disabled={isSubmitting}
        onClick={() => onRespond('unsure')}
      >
        <HelpCircle className="h-3 w-3 mr-1 text-muted-foreground" />
        {fr.playbooks.outcomeNudge.unsure}
      </Button>
    </div>
  );
}
