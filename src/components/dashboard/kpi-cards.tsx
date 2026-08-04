import { useT } from '@/lib/i18n/useT';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { DashboardMetrics } from '@/types/dashboard';
import { TrendingUp, TrendingDown, Users, AlertTriangle, DollarSign, Target, HelpCircle } from 'lucide-react';

interface KpiCardsProps {
  metrics: DashboardMetrics;
}

export function KpiCards({ metrics }: KpiCardsProps) {
  const fr = useT();
  const currency = metrics.currency ?? 'usd';
  const kpis = [
    {
      key: 'mrr',
      label: fr.dashboard.mrr,
      value: fr.format.currency(metrics.mrr_cents, currency),
      isUnavailable: false,
      icon: DollarSign,
      color: 'text-primary',
      tooltip: fr.dashboard.tooltips.mrr,
    },
    {
      key: 'arr',
      label: fr.dashboard.arr,
      value: fr.format.currency(metrics.arr_cents, currency),
      isUnavailable: false,
      icon: TrendingUp,
      color: 'text-success',
      tooltip: fr.dashboard.tooltips.arr,
    },
    {
      key: 'nrr',
      label: fr.dashboard.nrr,
      value: metrics.nrr_percentage !== null ? fr.format.percentage(metrics.nrr_percentage) : fr.dashboard.nrrUnavailable,
      isUnavailable: metrics.nrr_percentage === null,
      icon: (metrics.nrr_percentage ?? 0) >= 100 ? TrendingUp : TrendingDown,
      color: metrics.nrr_percentage === null ? 'text-muted-foreground' : metrics.nrr_percentage >= 100 ? 'text-success' : 'text-warning',
      tooltip: fr.dashboard.tooltips.nrr,
    },
    {
      key: 'active-accounts',
      label: fr.dashboard.activeAccounts,
      value: fr.format.number(metrics.active_accounts),
      isUnavailable: false,
      icon: Users,
      color: 'text-primary',
      tooltip: fr.dashboard.tooltips.activeAccounts,
    },
    {
      key: 'accounts-at-risk',
      label: fr.dashboard.accountsAtRisk,
      value: fr.format.number(metrics.accounts_at_risk),
      isUnavailable: false,
      icon: AlertTriangle,
      color: 'text-destructive',
      tooltip: fr.dashboard.tooltips.accountsAtRisk,
    },
    {
      key: 'mrr-at-risk',
      label: fr.dashboard.mrrAtRisk,
      value: fr.format.currency(metrics.mrr_at_risk_cents, currency),
      isUnavailable: false,
      icon: AlertTriangle,
      color: 'text-destructive',
      tooltip: fr.dashboard.tooltips.mrrAtRisk,
    },
    {
      key: 'expansion-opportunities',
      label: fr.dashboard.expansionOpportunities,
      value: fr.format.number(metrics.expansion_opportunities),
      isUnavailable: false,
      icon: Target,
      color: 'text-success',
      tooltip: fr.dashboard.tooltips.expansionOpportunities,
    },
    {
      key: 'churn-rate',
      label: fr.dashboard.churnRate,
      value: metrics.churn_rate !== null ? fr.format.percentage(metrics.churn_rate) : '—',
      isUnavailable: metrics.churn_rate === null,
      icon: TrendingDown,
      color: (metrics.churn_rate ?? 0) > 5 ? 'text-destructive' : 'text-muted-foreground',
      tooltip: fr.dashboard.tooltips.churnRate,
    },
  ];

  return (
    <TooltipProvider>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <Card key={kpi.label} data-testid={`kpi-${kpi.key}`} className="hover:shadow-card transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1">
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-muted-foreground/50 hover:text-muted-foreground cursor-help flex-shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-64">
                      <p>{kpi.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
              <p className={kpi.isUnavailable ? 'text-sm font-medium text-muted-foreground' : 'text-xl font-bold'}>
                {kpi.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </TooltipProvider>
  );
}
