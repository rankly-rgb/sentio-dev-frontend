import { Link } from 'react-router-dom';
import { ArrowRight, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useT } from '@/lib/i18n/useT';
import { en } from '@/i18n/en';
import { cn } from '@/lib/utils';
import { useTodayStatus } from '@/hooks/useTodayStatus';

function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'EUR' });
}

function HeroSkeleton() {
  return (
    <Card className="p-5 border-0 shadow-sm animate-pulse">
      <div className="flex items-start gap-3">
        <div className="h-5 w-5 rounded-full bg-muted shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-1/3 rounded bg-muted" />
          <div className="h-3 w-2/3 rounded bg-muted" />
        </div>
      </div>
    </Card>
  );
}

export default function TodayHeroCard() {
  const fr = useT();
  const { data, isLoading, error, refetch } = useTodayStatus();

  if (isLoading) {
    return <HeroSkeleton />;
  }

  if (error) {
    return (
      <Card className="p-5 border border-destructive/30 bg-destructive/5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-destructive">{en.today.hero.loadError}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5 shrink-0">
            <RefreshCw className="h-3.5 w-3.5" />
            {fr.common.retry}
          </Button>
        </div>
      </Card>
    );
  }

  if (!data) {
    return <HeroSkeleton />;
  }

  const urgent = data.status === 'critical' || data.status === 'at_risk' ? data.top_urgent_account : null;

  const attentionLink = data.critical_count > 0 && (
    <Link
      to="/insights?priority=critical"
      className="text-xs font-medium underline underline-offset-2 hover:no-underline"
    >
      {fr.today.hero.requiresAttention(data.critical_count)}
    </Link>
  );

  if (urgent) {
    const isCritical = data.status === 'critical';
    return (
      <Card className={cn('p-5 border shadow-sm', isCritical ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200')}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <AlertTriangle className={cn('h-5 w-5 mt-0.5 shrink-0', isCritical ? 'text-red-600' : 'text-orange-600')} />
            <div className="min-w-0 space-y-2">
              <p className={cn('text-sm font-semibold', isCritical ? 'text-red-700' : 'text-orange-700')}>
                {urgent.name}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span className="text-muted-foreground">
                  {fr.today.hero.mrrExposed} : <strong className="text-foreground">{formatCurrency(urgent.mrr)}</strong>
                </span>
                <Badge variant={isCritical ? 'destructive' : 'outline'} className={!isCritical ? 'border-orange-300 text-orange-700' : undefined}>
                  {fr.today.hero.riskScore} : {Math.round(urgent.risk_score)}%
                </Badge>
              </div>
              {(urgent.top_insight ?? '') !== '' && (
                <p className="text-sm text-muted-foreground">{urgent.top_insight ?? ''}</p>
              )}
              {attentionLink}
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

  return (
    <Card className="p-5 border border-green-200 bg-green-50 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <ShieldCheck className="h-5 w-5 mt-0.5 shrink-0 text-green-600" />
          <div className="min-w-0 space-y-2">
            <p className="text-sm font-semibold text-green-700">{fr.today.hero.stableTitle}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="text-muted-foreground">
                {fr.today.hero.mrrSecured} : <strong className="text-foreground">{formatCurrency(data.total_mrr_cents / 100)}</strong>
              </span>
              <span className="text-muted-foreground">{fr.today.hero.championsCount(data.champions_count)}</span>
            </div>
            {attentionLink}
          </div>
        </div>
        <Button asChild size="sm" variant="outline" className="shrink-0 gap-1 border-green-300 text-green-700 hover:bg-green-100">
          <Link to="/dashboard">
            {fr.todayActions.viewDashboard} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
