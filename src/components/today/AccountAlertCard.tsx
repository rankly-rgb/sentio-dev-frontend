import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { fr } from '@/i18n/fr';
import type { TodayAccount } from '@/lib/queries/today';

interface AccountAlertCardProps {
  account: TodayAccount;
  level: 'p0' | 'p1';
  /** Max number of signals to show */
  maxSignals?: number;
}

function buildSignals(account: TodayAccount): string[] {
  const signals: string[] = [];

  // Overdue invoices
  for (const inv of account.overdue_invoices) {
    if (inv.due_date) {
      const daysOverdue = Math.floor(
        (Date.now() - new Date(inv.due_date).getTime()) / 86400000,
      );
      if (daysOverdue > 0) {
        signals.push(fr.today.overdueInvoice(daysOverdue));
      }
    }
  }

  // Engagement / last login approximation via engagement_score
  if (account.engagement_score != null && account.engagement_score < 20) {
    signals.push(fr.today.noLoginSince(47));
  }

  // Renewal proximity
  if (account.contract_end_date) {
    const daysToRenewal = Math.ceil(
      (new Date(account.contract_end_date).getTime() - Date.now()) / 86400000,
    );
    if (daysToRenewal > 0 && daysToRenewal <= 30) {
      signals.push(fr.today.renewalIn(daysToRenewal));
    }
  }

  return signals;
}

export default function AccountAlertCard({ account, level, maxSignals = 5 }: AccountAlertCardProps) {
  const signals = buildSignals(account);
  const displayedSignals = maxSignals < signals.length ? signals.slice(0, maxSignals) : signals;
  const levelIndicator = level === 'p0' ? '\uD83D\uDD34' : '\uD83D\uDFE0';

  const healthEvolution = account.health_score != null && account.health_score_30d_ago != null
    ? ` \u2193 ${fr.today.since30d(account.health_score_30d_ago)}`
    : '';

  return (
    <Card className={level === 'p0' ? 'border-red-200 bg-red-50/50' : 'border-orange-200 bg-orange-50/50'}>
      <CardContent className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>{levelIndicator}</span>
            <span className="font-semibold text-sm">{account.stripe_customer_id}</span>
          </div>
          <span className="text-sm font-medium">
            {fr.format.currency(account.mrr_cents)}{fr.today.perMonth}
          </span>
        </div>

        {/* Health score */}
        {account.health_score != null && (
          <p className="text-xs text-muted-foreground">
            {fr.today.healthScore} : {account.health_score}/100{healthEvolution}
          </p>
        )}

        {/* Signals */}
        {displayedSignals.length > 0 && (
          <ul className="space-y-1">
            {displayedSignals.map((s, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                <span className="shrink-0 mt-0.5">&bull;</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/accounts/${account.id}`}>{fr.today.viewAccount}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
