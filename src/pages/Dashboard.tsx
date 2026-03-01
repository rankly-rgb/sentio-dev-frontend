import { useDashboardData } from '@/hooks/useDashboardData';
import { fr } from '@/i18n/fr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScoreGauge } from '@/components/dashboard/score-gauge';
import { KpiCards } from '@/components/dashboard/kpi-cards';
import { HealthDistributionChart } from '@/components/dashboard/health-distribution-chart';
import { MrrChart } from '@/components/dashboard/mrr-chart';
import { ChurnRiskAlert } from '@/components/dashboard/churn-risk-alert';
import { ExpansionOpportunities } from '@/components/dashboard/expansion-opportunities';
import { SyncProgressPanel } from '@/components/dashboard/sync-progress-panel';

export default function Dashboard() {
  const { metrics, distribution, isLoading, error } = useDashboardData();

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="p-6">
            <p className="text-destructive">{fr.common.error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{fr.dashboard.title}</h1>
        <SyncProgressPanel />
      </div>

      {metrics && <KpiCards metrics={metrics} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {metrics && (
          <Card>
            <CardHeader>
              <CardTitle>{fr.scores.healthScore}</CardTitle>
            </CardHeader>
            <CardContent>
              <ScoreGauge value={metrics.avg_health_score} label={fr.scores.healthScore} color="hsl(var(--primary))" />
            </CardContent>
          </Card>
        )}

        {distribution && <HealthDistributionChart distribution={distribution} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MrrChart />
        <div className="space-y-4">
          <ChurnRiskAlert count={metrics?.accounts_at_risk || 0} mrrAtRisk={metrics?.mrr_at_risk_cents || 0} />
          <ExpansionOpportunities count={metrics?.expansion_opportunities || 0} />
        </div>
      </div>
    </div>
  );
}
