import { Link } from 'react-router-dom';
import { Trophy, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import AccountName from '@/components/AccountName';
import { useT } from '@/lib/i18n/useT';
import { useWeeklyWins } from '@/hooks/useWeeklyWins';

function ScoreArrow({ before, after }: { before: number; after: number }) {
  const delta = Math.round(after - before);
  const color = delta >= 0 ? 'text-success' : 'text-destructive';
  const bgBefore = before >= 70 ? 'bg-success/15 text-success' : before >= 40 ? 'bg-warning/15 text-warning' : 'bg-destructive/15 text-destructive';
  const bgAfter = after >= 70 ? 'bg-success/15 text-success' : after >= 40 ? 'bg-warning/15 text-warning' : 'bg-destructive/15 text-destructive';

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${bgBefore}`}>
        {Math.round(before)}
      </span>
      <ArrowRight className="h-3 w-3 text-muted-foreground" />
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${bgAfter}`}>
        {Math.round(after)}
      </span>
      <span className={`text-xs font-bold ${color}`}>
        {delta >= 0 ? '+' : ''}{delta}
      </span>
    </div>
  );
}

export default function WeeklyWins() {
  const fr = useT();
  const { data, isLoading, error } = useWeeklyWins();

  if (error) return null;

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-amber-50/30 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-36" />
        </div>
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
      </div>
    );
  }

  const wins = data?.slice(0, 5) ?? [];

  return (
    <div className="rounded-xl border border-amber-200/50 bg-amber-50/20 p-4 space-y-3 animate-fade-in">
      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4 text-amber-600" />
        <h3 className="text-sm font-semibold text-amber-900">{fr.wins.title}</h3>
      </div>

      {wins.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">{fr.wins.emptyState}</p>
      ) : (
        <div className="space-y-2">
          {wins.map((win) => {
            const segmentChanged = win.segment_before !== win.segment_now && win.segment_now !== null;
            return (
              <Link
                key={win.account_id}
                to={`/accounts/${win.account_id}`}
                className="flex items-center justify-between gap-3 rounded-lg bg-white/60 hover:bg-white/90 px-3 py-2 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium truncate">
                      <AccountName stripeId={win.stripe_customer_id} displayName={win.display_name} />
                    </span>
                    {segmentChanged && (
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary shrink-0">
                        {win.segment_now === 'champions' ? fr.wins.champion : win.segment_now}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{win.main_dimension}</p>
                </div>
                <ScoreArrow before={win.health_score_7d_ago} after={win.health_score_now} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
