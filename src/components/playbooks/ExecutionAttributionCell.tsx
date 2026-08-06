import { Loader2, Clock, CheckCircle2, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useT } from '@/lib/i18n/useT';
import { usePlaybookExecutionMark } from '@/hooks/usePlaybookExecutionMark';
import { usePlaybookOutcomeNudge } from '@/hooks/usePlaybookOutcomeNudge';
import OutcomeNudge from '@/components/playbooks/OutcomeNudge';

interface Props {
  executionId: string;
}

export default function ExecutionAttributionCell({ executionId }: Props) {
  const fr = useT();
  const {
    attributionStatus,
    isLoading,
    mark,
    isMarking,
    unmark,
    isUnmarking,
    withinCancelWindow,
  } = usePlaybookExecutionMark(executionId);

  const status = attributionStatus?.attribution_status;
  const { isNudgeDue, nudgeResponse, submitNudge, isSubmitting } = usePlaybookOutcomeNudge(
    executionId,
    status,
  );

  if (isLoading) {
    return <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />;
  }

  if (!attributionStatus || status === 'not_executed') {
    return (
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs"
        disabled={isMarking}
        onClick={() => mark()}
      >
        {isMarking && <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />}
        {fr.playbooks.attribution.markExecuted}
      </Button>
    );
  }

  const seconds = attributionStatus.time_remaining_seconds;
  let windowLabel = fr.playbooks.attribution.windowExpired;
  if (seconds !== null && seconds > 0) {
    const days = Math.floor(seconds / 86400);
    windowLabel = days >= 1
      ? fr.playbooks.attribution.daysRemaining(days)
      : fr.playbooks.attribution.hoursRemaining(Math.max(1, Math.floor(seconds / 3600)));
  }

  // Cancel affordance gated on the same two conflict cases as API_CONTRACTS.md § 8.1.1's
  // 409s (auto-resolution already detected, nudge already answered), plus the 5-minute
  // window — checked client-side so the button never appears where the backend would reject it
  const canCancel = withinCancelWindow && status !== 'resolved' && nudgeResponse === null;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        {status === 'resolved' ? (
          <Badge
            variant="default"
            className="flex w-fit items-center gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
          >
            <CheckCircle2 className="h-3 w-3" />
            {fr.playbooks.attribution.resolved}
          </Badge>
        ) : (
          <Badge variant="outline" className="flex w-fit items-center gap-1">
            <Clock className="h-3 w-3" />
            {windowLabel}
          </Badge>
        )}
        {canCancel && (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-1.5 text-xs text-muted-foreground"
            disabled={isUnmarking}
            onClick={() => unmark()}
          >
            {isUnmarking
              ? <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              : <Undo2 className="h-3 w-3 mr-1" />}
            {fr.playbooks.attribution.cancelMark}
          </Button>
        )}
      </div>
      {isNudgeDue && <OutcomeNudge onRespond={submitNudge} isSubmitting={isSubmitting} />}
      {nudgeResponse !== null && (
        <span className="text-xs text-muted-foreground">
          {fr.playbooks.outcomeNudge.responseLabel[nudgeResponse]}
        </span>
      )}
    </div>
  );
}
