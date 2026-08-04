import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMrrMovementSummary } from '@/lib/queries/mrr';
import { usePortfolioMetrics } from '@/hooks/usePortfolioMetrics';
import { useT } from '@/lib/i18n/useT';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

function formatMonth(offset: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return d.toISOString().split('T')[0];
}

export default function MrrDashboard() {
  const fr = useT();
  const { user } = useAuth();
  const [period] = useState({ from: formatMonth(-1), to: formatMonth(0) });

  const summaryQuery = useQuery({
    queryKey: ['mrr', 'summary', period],
    queryFn: () => getMrrMovementSummary(period),
    staleTime: 120_000,
  });

  // NRR autoritaire (portfolio-metrics, Phase 4 backend) — plus de
  // deuxième implémentation locale (AUDIT_LOGIQUE_METIER_STRIPE.md point 22 :
  // calculateNrr() divergeait numériquement du Dashboard principal pour la
  // même org le même jour).
  const portfolioMetricsQuery = usePortfolioMetrics();

  const summary = summaryQuery.data;
  const nrr = portfolioMetricsQuery.data?.nrr_percentage ?? null;
  const currency = portfolioMetricsQuery.data?.currency ?? user?.currency ?? 'usd';
  const isLoading = summaryQuery.isLoading || portfolioMetricsQuery.isLoading;

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">{fr.mrr.title}</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Amounts shown in {currency.toUpperCase()}
        </p>
      </div>

      {/* NRR en grand */}
      <Card className={nrr === null ? '' : nrr >= 100 ? 'border-success' : 'border-warning'}>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">{fr.dashboard.nrr}</p>
          <p className={nrr === null ? 'text-lg font-medium text-muted-foreground' : 'text-4xl font-bold'}>
            {nrr !== null ? fr.format.percentage(nrr) : fr.dashboard.nrrUnavailable}
          </p>
          {nrr !== null && (
            <p className="text-xs text-muted-foreground mt-1">
              {nrr >= 100 ? fr.dashboard.nrrAboveTarget : fr.dashboard.nrrBelowTarget}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Mouvements MRR */}
      {summary && (
        <TooltipProvider>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: fr.mrr.new, tooltip: fr.mrr.tooltips.new, value: summary.new_cents, color: 'text-success' },
              { label: fr.mrr.expansion, tooltip: fr.mrr.tooltips.expansion, value: summary.expansion_cents, color: 'text-success' },
              { label: fr.mrr.reactivation, tooltip: fr.mrr.tooltips.reactivation, value: summary.reactivation_cents, color: 'text-success' },
              { label: fr.mrr.contraction, tooltip: fr.mrr.tooltips.contraction, value: -summary.contraction_cents, color: 'text-destructive' },
              { label: fr.mrr.churn, tooltip: fr.mrr.tooltips.churn, value: -summary.churn_cents, color: 'text-destructive' },
              { label: fr.mrr.net, tooltip: fr.mrr.tooltips.net, value: summary.net_cents, color: summary.net_cents >= 0 ? 'text-success' : 'text-destructive' },
            ].map(item => (
              <Card key={item.label}>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 text-muted-foreground/50 hover:text-muted-foreground cursor-help flex-shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-64">
                        <p>{item.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className={`text-lg font-bold ${item.color}`}>
                    {fr.format.currency(Math.abs(item.value), currency)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TooltipProvider>
      )}

      {/* TODO: Graphique tendance MRR avec recharts */}
      <Card>
        <CardHeader><CardTitle>{fr.mrr.trend}</CardTitle></CardHeader>
        <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
          Graphique tendance MRR (recharts)
        </CardContent>
      </Card>
    </div>
  );
}
