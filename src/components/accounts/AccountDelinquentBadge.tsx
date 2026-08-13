import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CreditCard } from 'lucide-react';
import { useT } from '@/lib/i18n/useT';
import { delinquentDurationDays, formatDelinquentDuration } from '@/lib/scoring-display';

interface Props {
  isDelinquent: boolean;
  /** Lot 5 (2026-08-13, #35) — optional: older call sites that don't yet fetch it stay `undefined`, which renders like `null` (no duration shown). */
  delinquentSince?: string | null;
}

/**
 * Standalone visual marker for accounts.is_delinquent (audit délinquence
 * 2026-08-06, point 5) — deliberately separate from AccountPriorityBadge:
 * priority_label folds is_delinquent into the same 'critical' bucket as a
 * high churn risk score or a low health score, which is correct for
 * triage but doesn't let a user tell "delinquent" apart from "at risk for
 * some other reason" at a glance. This badge is that distinction.
 *
 * Tooltip surfaces the past-due MRR convention (docs/openspec.md §5, backend
 * repo) directly at the point where a user would otherwise have to guess it:
 * a delinquent subscription stays counted in MRR until Stripe itself marks
 * it cancelled — a deliberate, already-decided convention, not a bug. Making
 * it visible here is the fix; the convention itself doesn't change.
 */
export default function AccountDelinquentBadge({ isDelinquent, delinquentSince = null }: Props) {
  const fr = useT();
  if (!isDelinquent) return null;

  // Lot 5 (2026-08-13, #35) — never "0 days" for an unknown date (S1):
  // formatDelinquentDuration returns '—' when delinquentSince is null, and
  // the badge itself just omits the duration suffix rather than showing a
  // dash next to "Past due" (redundant with the tooltip's own explanation).
  const days = delinquentDurationDays(delinquentSince);
  const durationLabel = formatDelinquentDuration(delinquentSince);
  const floorNote =
    days !== null && days >= 45
      ? fr.scores.delinquentFloorCritical(days)
      : days !== null && days >= 15
        ? fr.scores.delinquentFloorHigh(days)
        : null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 font-medium gap-1 cursor-help">
          <CreditCard className="h-3 w-3" />
          Past due{days !== null && ` · ${durationLabel}`}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[240px] text-xs space-y-1">
        <p>{fr.accounts.delinquentTooltip}</p>
        {floorNote && <p className="text-muted-foreground">{floorNote}</p>}
      </TooltipContent>
    </Tooltip>
  );
}
