import { Link } from 'react-router-dom';
import { ArrowRight, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AccountName from '@/components/AccountName';
import { useT } from '@/lib/i18n/useT';
import { cn } from '@/lib/utils';
import type { Account } from '@/types/database';

interface TodayHeroCardProps {
  accounts: Account[];
  p0InsightsCount: number;
}

function computeMostUrgentAccount(accounts: Account[]): Account | null {
  const atRisk = accounts.filter((a) => (a.churn_risk_score ?? 0) >= 50);
  if (atRisk.length === 0) return null;
  return [...atRisk].sort((a, b) => {
    const riskDiff = (b.churn_risk_score ?? 0) - (a.churn_risk_score ?? 0);
    if (riskDiff !== 0) return riskDiff;
    return (b.mrr_cents ?? 0) - (a.mrr_cents ?? 0);
  })[0];
}

export default function TodayHeroCard({ accounts, p0InsightsCount }: TodayHeroCardProps) {
  const fr = useT();
  const urgent = computeMostUrgentAccount(accounts);

  const p0Link = p0InsightsCount > 0 && (
    <Link
      to="/insights?priority=critical"
      className="text-xs font-medium underline underline-offset-2 hover:no-underline"
    >
      {fr.briefing.actionsP0(p0InsightsCount)}
    </Link>
  );

  if (urgent) {
    const isCritical = (urgent.churn_risk_score ?? 0) >= 70;
    return (
      <Card className={cn('p-5 border-0 shadow-sm', isCritical ? 'bg-red-50' : 'bg-orange-50')}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <AlertTriangle className={cn('h-5 w-5 mt-0.5 shrink-0', isCritical ? 'text-red-600' : 'text-orange-600')} />
            <div className="min-w-0 space-y-2">
              <p className={cn('text-sm font-semibold', isCritical ? 'text-red-700' : 'text-orange-700')}>
                {fr.today.hero.urgentTitle}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <AccountName stripeId={urgent.stripe_customer_id} displayName={urgent.display_name} />
                <span className="text-muted-foreground">
                  {fr.today.hero.mrrExposed} : <strong className="text-foreground">{fr.format.currency(urgent.mrr_cents)}</strong>
                </span>
                <span className="text-muted-foreground">
                  {fr.today.hero.riskScore} :{' '}
                  <strong className={isCritical ? 'text-red-600' : 'text-orange-600'}>
                    {Math.round(urgent.churn_risk_score ?? 0)}%
                  </strong>
                </span>
              </div>
              {p0Link}
            </div>
          </div>
          <Button asChild size="sm" variant={isCritical ? 'destructive' : 'default'} className="shrink-0 gap-1">
            <Link to={`/accounts/${urgent.id}`}>
              {fr.today.hero.viewAccount} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </Card>
    );
  }

  const securedMrrCents = accounts
    .filter((a) => (a.churn_risk_score ?? 0) < 50)
    .reduce((sum, a) => sum + (a.mrr_cents ?? 0), 0);
  const championsCount = accounts.filter(
    (a) => (a.health_score ?? 0) >= 80 && (a.churn_risk_score ?? 100) < 50,
  ).length;

  return (
    <Card className="p-5 border-0 shadow-sm bg-green-50">
      <div className="flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 mt-0.5 shrink-0 text-green-600" />
        <div className="min-w-0 space-y-2">
          <p className="text-sm font-semibold text-green-700">{fr.today.hero.stableTitle}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="text-muted-foreground">
              {fr.today.hero.mrrSecured} : <strong className="text-foreground">{fr.format.currency(securedMrrCents)}</strong>
            </span>
            <span className="text-muted-foreground">{fr.today.hero.championsCount(championsCount)}</span>
          </div>
          {p0Link}
        </div>
      </div>
    </Card>
  );
}
