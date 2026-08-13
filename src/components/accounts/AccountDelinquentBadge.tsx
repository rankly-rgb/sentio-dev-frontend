import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CreditCard } from 'lucide-react';
import { useT } from '@/lib/i18n/useT';

interface Props {
  isDelinquent: boolean;
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
export default function AccountDelinquentBadge({ isDelinquent }: Props) {
  const fr = useT();
  if (!isDelinquent) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 font-medium gap-1 cursor-help">
          <CreditCard className="h-3 w-3" />
          Past due
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[240px] text-xs">
        {fr.accounts.delinquentTooltip}
      </TooltipContent>
    </Tooltip>
  );
}
