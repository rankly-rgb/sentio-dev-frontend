import { Link } from 'react-router-dom';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useManualSync } from '@/hooks/useManualSync';
import { useIntegrationStatus } from '@/hooks/useIntegrations';
import { fr } from '@/i18n/fr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScoreGauge } from '@/components/dashboard/score-gauge';
import { KpiCards } from '@/components/dashboard/kpi-cards';
import { HealthDistributionChart } from '@/components/dashboard/health-distribution-chart';
import { MrrChart } from '@/components/dashboard/mrr-chart';
import { ChurnRiskAlert } from '@/components/dashboard/churn-risk-alert';
import { ExpansionOpportunities } from '@/components/dashboard/expansion-opportunities';
import { SyncProgressPanel } from '@/components/dashboard/sync-progress-panel';
import { RefreshCw, Calculator, CheckCircle, XCircle, Info } from 'lucide-react';

export default function Dashboard() {
  const { metrics, distribution, isLoading, error, refetch } = useDashboardData();
  const { triggerStripeSync, calculateScores, isSyncing, isCalculating } = useManualSync();
  const { data: integrationStatus } = useIntegrationStatus();

  async function handleSync() {
    await triggerStripeSync('incremental');
    refetch();
  }

  async function handleCalculate() {
    await calculateScores();
    refetch();
  }

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
      {/* Header + actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">{fr.dashboard.title}</h1>

        <div className="flex items-center gap-2 flex-wrap">
          <SyncProgressPanel />

          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing || isCalculating}
            aria-label="Lancer sync Stripe"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? fr.dashboard.syncInProgress : 'Sync Stripe'}
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleCalculate}
            disabled={isSyncing || isCalculating}
            aria-label="Recalculer les scores"
          >
            <Calculator className={`h-4 w-4 mr-2 ${isCalculating ? 'animate-spin' : ''}`} />
            {isCalculating ? 'Calcul...' : fr.syncs.recalculateScores}
          </Button>
        </div>
      </div>

      {/* Integration status banner */}
      {integrationStatus && (
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/settings/integrations">
            <Badge
              variant={integrationStatus.stripe.connected ? 'default' : 'secondary'}
              className={integrationStatus.stripe.connected ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
            >
              {integrationStatus.stripe.connected ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : (
                <XCircle className="h-3 w-3 mr-1" />
              )}
              Stripe {integrationStatus.stripe.connected ? fr.integrations.connected : fr.integrations.notConnected}
            </Badge>
          </Link>
          <Link to="/settings/integrations">
            <Badge
              variant={integrationStatus.hubspot.connected ? 'default' : 'secondary'}
              className={integrationStatus.hubspot.connected ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
            >
              {integrationStatus.hubspot.connected ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : (
                <XCircle className="h-3 w-3 mr-1" />
              )}
              HubSpot {integrationStatus.hubspot.connected ? fr.integrations.connected : fr.integrations.notConnected}
            </Badge>
          </Link>
          {!integrationStatus.hubspot.connected && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Info className="h-3 w-3" />
              {fr.integrations.oauth.hubspotInfo}
            </span>
          )}
        </div>
      )}

      {/* KPI cards */}
      {metrics && <KpiCards metrics={metrics} />}

      {/* Score gauge + distribution */}
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

      {/* MRR + alertes */}
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
