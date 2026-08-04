import { useT } from '@/lib/i18n/useT';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { DashboardMetrics } from '@/types/dashboard';
import { TrendingUp, TrendingDown, Users, AlertTriangle, DollarSign, Target, HelpCircle } from 'lucide-react';

interface KpiCardsProps {
  metrics: DashboardMetrics;
}

export function KpiCards({ metrics }: KpiCardsProps) {
  const fr = useT();
  const { user } = useAuth();
  const currency = user?.currency ?? 'usd';
  const kpis = [
    {
      key: 'mrr',
      label: fr.dashboard.mrr,
      value: fr.format.currency(metrics.mrr_cents, currency),
      icon: DollarSign,
      color: 'text-primary',
      tooltip: fr.dashboard.tooltips.mrr,
    },
    {
      key: 'arr',
      label: fr.dashboard.arr,
      value: fr.format.currency(metrics.arr_cents, currency),
      icon: TrendingUp,
      color: 'text-success',
      tooltip: fr.dashboard.tooltips.arr,
    },
    {
      key: 'nrr',
      label: fr.dashboard.nrr,
      value: fr.format.percentage(metrics.nrr_percentage),
      icon: metrics.nrr_percentage >= 100 ? TrendingUp : TrendingDown,
      color: metrics.nrr_percentage >= 100 ? 'text-success' : 'text-warning',
      tooltip: fr.dashboard.tooltips.nrr,
    },
    {
      key: 'active-accounts',
      label: fr.dashboard.activeAccounts,
      value: fr.format.number(metrics.active_accounts),
      icon: Users,
      color: 'text-primary',
      tooltip: fr.dashboard.tooltips.activeAccounts,
    },
    {
      key: 'accounts-at-risk',
      label: fr.dashboard.accountsAtRisk,
      value: fr.format.number(metrics.accounts_at_risk),
      icon: AlertTriangle,
      color: 'text-destructive',
      tooltip: fr.dashboard.tooltips.accountsAtRisk,
    },
    {
      key: 'mrr-at-risk',
      label: fr.dashboard.mrrAtRisk,
      value: fr.format.currency(metrics.mrr_at_risk_cents, currency),
      icon: AlertTriangle,
      color: 'text-destructive',
      tooltip: fr.dashboard.tooltips.mrrAtRisk,
    },
    {
      key: 'expansion-opportunities',
      label: fr.dashboard.expansionOpportunities,
      value: fr.format.number(metrics.expansion_opportunities),
      icon: Target,
      color: 'text-success',
      tooltip: fr.dashboard.tooltips.expansionOpportunities,
    },
    {
      key: 'churn-rate',
      label: fr.dashboard.churnRate,
      value: fr.format.percentage(metrics.churn_rate),
      icon: TrendingDown,
      color: metrics.churn_rate > 5 ? 'text-destructive' : 'text-muted-foreground',
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
              <p className="text-xl font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </TooltipProvider>
  );
}
