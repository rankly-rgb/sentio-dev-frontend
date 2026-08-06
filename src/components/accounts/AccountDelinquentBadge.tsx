import { Badge } from '@/components/ui/badge';
import { CreditCard } from 'lucide-react';

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
 */
export default function AccountDelinquentBadge({ isDelinquent }: Props) {
  if (!isDelinquent) return null;

  return (
    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 font-medium gap-1">
      <CreditCard className="h-3 w-3" />
      Past due
    </Badge>
  );
}
