import { fr } from '@/i18n/fr';
import { Card, CardContent } from '@/components/ui/card';
import type { DashboardMetrics } from '@/types/dashboard';
import { TrendingUp, TrendingDown, Users, AlertTriangle, DollarSign, Target } from 'lucide-react';

interface KpiCardsProps {
  metrics: DashboardMetrics;
}

export function KpiCards({ metrics }: KpiCardsProps) {
  const kpis = [
    {
      label: fr.dashboard.mrr,
      value: fr.format.currency(metrics.mrr_cents),
      icon: DollarSign,
      color: 'text-primary',
    },
    {
      label: fr.dashboard.arr,
      value: fr.format.currency(metrics.arr_cents),
      icon: TrendingUp,
      color: 'text-success',
    },
    {
      label: fr.dashboard.nrr,
      value: fr.format.percentage(metrics.nrr_percentage),
      icon: metrics.nrr_percentage >= 100 ? TrendingUp : TrendingDown,
      color: metrics.nrr_percentage >= 100 ? 'text-success' : 'text-warning',
    },
    {
      label: fr.dashboard.activeAccounts,
      value: metrics.active_accounts.toString(),
      icon: Users,
      color: 'text-primary',
    },
    {
      label: fr.dashboard.accountsAtRisk,
      value: metrics.accounts_at_risk.toString(),
      icon: AlertTriangle,
      color: 'text-destructive',
    },
    {
      label: fr.dashboard.mrrAtRisk,
      value: fr.format.currency(metrics.mrr_at_risk_cents),
      icon: AlertTriangle,
      color: 'text-destructive',
    },
    {
      label: fr.dashboard.expansionOpportunities,
      value: metrics.expansion_opportunities.toString(),
      icon: Target,
      color: 'text-success',
    },
    {
      label: fr.dashboard.churnRate,
      value: fr.format.percentage(metrics.churn_rate),
      icon: TrendingDown,
      color: metrics.churn_rate > 5 ? 'text-destructive' : 'text-muted-foreground',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {kpis.map(kpi => (
        <Card key={kpi.label} className="hover:shadow-card transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </div>
            <p className="text-xl font-bold">{kpi.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
