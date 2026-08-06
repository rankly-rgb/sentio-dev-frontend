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
      isCurrency: true,
      icon: DollarSign,
      color: 'text-primary',
      tooltip: fr.dashboard.tooltips.mrr,
      caption: null as string | null,
    },
    {
      key: 'arr',
      label: fr.dashboard.arr,
      value: fr.format.currency(metrics.arr_cents, currency),
      isUnavailable: false,
      isCurrency: true,
      icon: TrendingUp,
      color: 'text-success',
      tooltip: fr.dashboard.tooltips.arr,
      caption: null as string | null,
    },
    {
      key: 'nrr',
      label: fr.dashboard.nrr,
      value: metrics.nrr_percentage !== null ? fr.format.percentage(metrics.nrr_percentage) : fr.dashboard.nrrUnavailable,
      isUnavailable: metrics.nrr_percentage === null,
      isCurrency: false,
      icon: (metrics.nrr_percentage ?? 0) >= 100 ? TrendingUp : TrendingDown,
      color: metrics.nrr_percentage === null ? 'text-muted-foreground' : metrics.nrr_percentage >= 100 ? 'text-success' : 'text-warning',
      tooltip: fr.dashboard.tooltips.nrr,
      caption: null as string | null,
    },
    {
      key: 'active-accounts',
      label: fr.dashboard.activeAccounts,
      value: fr.format.number(metrics.active_accounts),
      isUnavailable: false,
      isCurrency: false,
      icon: Users,
      color: 'text-primary',
      tooltip: fr.dashboard.tooltips.activeAccounts,
      caption: null as string | null,
    },
    {
      key: 'accounts-at-risk',
      label: fr.dashboard.accountsAtRisk,
      value: fr.format.number(metrics.accounts_at_risk),
      isUnavailable: false,
      isCurrency: false,
      icon: AlertTriangle,
      color: 'text-destructive',
      tooltip: fr.dashboard.tooltips.accountsAtRisk,
      caption: null as string | null,
    },
    {
      key: 'mrr-at-risk',
      label: fr.dashboard.mrrAtRisk,
      value: fr.format.currency(metrics.mrr_at_risk_cents, currency),
      isUnavailable: false,
      isCurrency: true,
      icon: AlertTriangle,
      color: 'text-destructive',
      tooltip: fr.dashboard.tooltips.mrrAtRisk,
      // Audit délinquence 2026-08-06 : la majorité des comptes délinquents
      // ont mrr_status='unavailable' (mrr_cents=0 par exclusion de devise
      // minoritaire) — mrr_at_risk_cents ne les somme pas. Sans cette
      // légende, un lecteur verrait accounts_at_risk grimper sans que
      // mrr_at_risk_cents bouge, et lirait ça comme "rien à risque en
      // argent" au lieu de "certains comptes ne sont pas chiffrés".
      caption: metrics.accounts_at_risk_unpriced > 0 ? fr.dashboard.accountsAtRiskUnpriced(metrics.accounts_at_risk_unpriced) : null,
    },
    {
      key: 'expansion-opportunities',
      label: fr.dashboard.expansionOpportunities,
      value: fr.format.number(metrics.expansion_opportunities),
      isUnavailable: false,
      isCurrency: false,
      icon: Target,
      color: 'text-success',
      tooltip: fr.dashboard.tooltips.expansionOpportunities,
      caption: null as string | null,
    },
    {
      key: 'churn-rate',
      label: fr.dashboard.churnRate,
      value: metrics.churn_rate !== null ? fr.format.percentage(metrics.churn_rate) : '—',
      isUnavailable: metrics.churn_rate === null,
      isCurrency: false,
      icon: TrendingDown,
      color: (metrics.churn_rate ?? 0) > 5 ? 'text-destructive' : 'text-muted-foreground',
      tooltip: fr.dashboard.tooltips.churnRate,
      caption: null as string | null,
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
                {kpi.isCurrency && !kpi.isUnavailable && (
                  <span className="text-xs font-normal text-muted-foreground ml-1">{currency.toUpperCase()}</span>
                )}
              </p>
              {kpi.caption && (
                <p className="text-xs text-muted-foreground mt-1">{kpi.caption}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </TooltipProvider>
  );
}
