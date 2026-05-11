import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import ScoreBadge from '@/components/ScoreBadge';
import AccountName from '@/components/AccountName';
import { useT } from '@/lib/i18n/useT';
import type { TodayAction } from '@/lib/types/today-actions';

interface TodayActionRowProps {
  action: TodayAction;
  onAccountClick?: (accountId: string) => void;
}

const MAX_VISIBLE_REASONS = 2;

export default function TodayActionRow({ action, onAccountClick }: TodayActionRowProps) {
  const fr = useT();
  const visibleReasons = action.trigger_reasons.slice(0, MAX_VISIBLE_REASONS);
  const hiddenReasonsCount = action.trigger_reasons.length - MAX_VISIBLE_REASONS;

  return (
    <tr className="border-b border-border/30 hover:bg-muted/50 transition-colors">
      {/* Account name */}
      <td className="px-3 py-2.5">
        {onAccountClick ? (
          <button
            type="button"
            onClick={() => onAccountClick(action.account_id)}
            className="text-xs text-primary hover:underline text-left"
          >
            <AccountName stripeId={action.stripe_customer_id} displayName={action.display_name} />
          </button>
        ) : (
          <Link
            to={`/accounts/${action.account_id}`}
            className="text-xs text-primary hover:underline"
          >
            <AccountName stripeId={action.stripe_customer_id} displayName={action.display_name} />
          </Link>
        )}
      </td>

      {/* Plan */}
      <td className="px-3 py-2.5 text-xs text-muted-foreground capitalize">
        {action.plan_tier ?? '—'}
      </td>

      {/* MRR */}
      <td className="px-3 py-2.5 text-xs font-medium">
        {fr.format.currency(action.mrr_cents)}
      </td>

      {/* Health */}
      <td className="px-3 py-2.5">
        <ScoreBadge score={action.health_score} type="health" size="sm" />
      </td>

      {/* Churn risk */}
      <td className="px-3 py-2.5">
        <ScoreBadge score={action.churn_risk_score} type="churn" size="sm" />
      </td>

      {/* Trigger reasons */}
      <td className="px-3 py-2.5">
        <div className="flex flex-wrap gap-1">
          {visibleReasons.map((reason) => (
            <Badge key={reason} variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
              {reason}
            </Badge>
          ))}
          {hiddenReasonsCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal cursor-help">
                  +{hiddenReasonsCount}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                {action.trigger_reasons.slice(MAX_VISIBLE_REASONS).map((r) => (
                  <div key={r} className="text-xs">{r}</div>
                ))}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </td>

      {/* Playbooks */}
      <td className="px-3 py-2.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-xs text-muted-foreground cursor-help">
              {action.matching_playbooks.length} PB{action.matching_playbooks.length > 1 ? 's' : ''}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            {action.matching_playbooks.map((pb) => (
              <div key={pb.id} className="text-xs">
                <Link to={`/playbooks/${pb.id}`} className="hover:underline text-primary">
                  {pb.title}
                </Link>
              </div>
            ))}
          </TooltipContent>
        </Tooltip>
      </td>

      {/* Days to renewal */}
      <td className="px-3 py-2.5 text-xs text-muted-foreground">
        {action.days_to_renewal !== null ? `${action.days_to_renewal}j` : '—'}
      </td>
    </tr>
  );
}
