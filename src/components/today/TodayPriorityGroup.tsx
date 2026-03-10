import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fr } from '@/i18n/fr';
import { cn } from '@/lib/utils';
import { PRIORITY_CONFIG } from '@/lib/types/today-actions';
import type { TodayAction } from '@/lib/types/today-actions';
import type { PriorityCode } from '@/lib/priority-labels';
import TodayActionRow from './TodayActionRow';

interface TodayPriorityGroupProps {
  priority: PriorityCode;
  actions: TodayAction[];
  defaultExpanded: boolean;
  initialLimit?: number;
}

const COLUMN_HEADERS = [
  { key: 'stripe', label: fr.todayActions.colStripeId },
  { key: 'plan', label: fr.todayActions.colPlan },
  { key: 'mrr', label: fr.todayActions.colMrr },
  { key: 'health', label: fr.todayActions.colHealth },
  { key: 'churn', label: fr.todayActions.colChurnRisk },
  { key: 'reasons', label: fr.todayActions.colReasons },
  { key: 'playbooks', label: fr.todayActions.colPlaybooks },
  { key: 'renewal', label: fr.todayActions.colRenewal },
] as const;

export default function TodayPriorityGroup({
  priority,
  actions,
  defaultExpanded,
  initialLimit = 5,
}: TodayPriorityGroupProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [showAll, setShowAll] = useState(false);

  const config = PRIORITY_CONFIG[priority];
  const visibleActions = showAll ? actions : actions.slice(0, initialLimit);
  const hiddenCount = actions.length - initialLimit;
  const mrrTotal = actions.reduce((sum, a) => sum + a.mrr_cents, 0);

  if (actions.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/50 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
          config.color,
        )}
      >
        {expanded ? (
          <ChevronDown className={cn('h-4 w-4 shrink-0', config.textColor)} />
        ) : (
          <ChevronRight className={cn('h-4 w-4 shrink-0', config.textColor)} />
        )}

        <span className={cn('inline-flex h-2.5 w-2.5 rounded-full shrink-0', config.badgeColor)} />

        <span className={cn('text-sm font-semibold', config.textColor)}>
          {config.label} ({actions.length})
        </span>

        <span className="ml-auto text-xs text-muted-foreground">
          {fr.format.currency(mrrTotal)} MRR
        </span>
      </button>

      {/* Content */}
      {expanded && (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                {COLUMN_HEADERS.map(({ key, label }) => (
                  <th key={key} className="px-3 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleActions.map((action) => (
                <TodayActionRow key={action.account_id} action={action} />
              ))}
            </tbody>
          </table>

          {/* Show more / collapse */}
          {hiddenCount > 0 && (
            <div className="flex justify-center py-2 border-t border-border/30">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAll(!showAll)}
                className="text-xs text-muted-foreground"
              >
                {showAll ? fr.todayActions.collapse : fr.todayActions.showMore(hiddenCount)}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
