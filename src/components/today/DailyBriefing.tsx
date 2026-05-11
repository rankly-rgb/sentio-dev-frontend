import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import AccountName from '@/components/AccountName';
import { useT } from '@/lib/i18n/useT';
import { useDailyBriefing } from '@/hooks/useDailyBriefing';

function parseBoldMarkdown(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default function DailyBriefing() {
  const fr = useT();
  const { data, isLoading, error } = useDailyBriefing();

  if (error) return null;

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-4 space-y-3 animate-pulse">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!data) return null;

  const trend = data.portfolio.health_trend;
  const delta = data.portfolio.health_delta_7d;
  const isDown = trend === 'down';
  const isUp = trend === 'up';

  const sentenceText = isDown
    ? fr.briefing.portfolioDown(Math.abs(delta), data.risk_accounts_7d)
    : isUp
      ? fr.briefing.portfolioUp(delta)
      : fr.briefing.portfolioStable();

  const DeltaIcon = isDown ? TrendingDown : isUp ? TrendingUp : Minus;
  const deltaColor = isDown ? 'text-destructive' : isUp ? 'text-success' : 'text-muted-foreground';

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3 animate-fade-in">
      {/* Main sentence */}
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 shrink-0 ${deltaColor}`}>
          <DeltaIcon className="h-4 w-4" />
        </div>
        <p className="text-sm text-foreground leading-relaxed">
          {parseBoldMarkdown(sentenceText)}
        </p>
      </div>

      {/* Insight du jour */}
      {data.insight_du_jour && (
        <div className="rounded-lg bg-muted/40 px-3 py-2.5 flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
              {fr.briefing.insightOfDay}
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium truncate">
                <AccountName
                  stripeId={data.insight_du_jour.stripe_customer_id}
                  displayName={data.insight_du_jour.display_name}
                />
              </span>
              <span className={`text-xs font-semibold shrink-0 ${data.insight_du_jour.direction === 'up' ? 'text-success' : 'text-destructive'}`}>
                {data.insight_du_jour.direction === 'up' ? '+' : ''}{data.insight_du_jour.delta}
              </span>
            </div>
          </div>
          <Link
            to={`/accounts/${data.insight_du_jour.account_id}`}
            className="shrink-0 text-xs text-primary hover:underline flex items-center gap-1"
          >
            Voir <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* P0 insights */}
      {data.p0_insights_count > 0 && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {fr.briefing.actionsP0(data.p0_insights_count)}
          </span>
          <Link to="/today" className="text-primary hover:underline flex items-center gap-1">
            {fr.briefing.viewActions} <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
