import { Link } from 'react-router-dom';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useManualSync } from '@/hooks/useManualSync';
import { useIntegrationStatus } from '@/hooks/useIntegrations';
import { useSegments } from '@/hooks/useSegments';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { fr } from '@/i18n/fr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScoreGauge } from '@/components/dashboard/score-gauge';
import { KpiCards } from '@/components/dashboard/kpi-cards';
import { HealthDistributionChart } from '@/components/dashboard/health-distribution-chart';
import { MrrChart } from '@/components/dashboard/mrr-chart';
import { SyncProgressPanel } from '@/components/dashboard/sync-progress-panel';
import ScoreBadge from '@/components/ScoreBadge';
import {
  RefreshCw,
  Calculator,
  CheckCircle,
  XCircle,
  Info,
  ChevronRight,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { TrackerBanner } from '@/components/dashboard/tracker-banner';
import { SEGMENT_LABELS, SEGMENT_COLORS } from '@/lib/types/segments';
import type { TopAccount } from '@/hooks/useDashboardData';

const QUICK_SEGMENTS = ['champions', 'en_expansion', 'stables', 'a_risque_leger'] as const;

export default function Dashboard() {
  const { metrics, distribution, topAccounts, isLoading, error, refetch } = useDashboardData();
  const { triggerStripeSync, calculateScores, isSyncing, isCalculating } = useManualSync();
  const { data: integrationStatus } = useIntegrationStatus();
  const { data: segments } = useSegments();
  const { data: syncs } = useSyncStatus();
  const { organization } = useOrganizationSettings();
  const trackerConnected = organization?.usage_tracker_connected ?? false;

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

  const segmentCounts = new Map(
    (segments || []).map(s => [s.name, s.count]),
  );

  const recentSyncs = (syncs || []).slice(0, 3);

  return (
    <div className="space-y-6 p-6">
      {/* Tracker banner */}
      {!trackerConnected && <TrackerBanner />}

      {/* Header + actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">{fr.dashboard.title}</h1>
          <p className="text-sm text-muted-foreground">{fr.dashboard.subtitle}</p>
        </div>

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

      {/* Segment quick-links */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">{fr.dashboard.segmentsQuickLinks}</h2>
          <Link to="/segments" className="text-sm text-primary hover:underline flex items-center gap-1">
            {fr.dashboard.viewAll} <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {QUICK_SEGMENTS.map(key => {
            const colors = SEGMENT_COLORS[key];
            const count = segmentCounts.get(key) ?? 0;
            return (
              <Link key={key} to={`/segments/${key}`}>
                <Card className={`hover:shadow-md transition-shadow cursor-pointer border ${colors.bg}`}>
                  <CardContent className="p-4">
                    <p className={`text-xs font-medium ${colors.text}`}>{SEGMENT_LABELS[key]}</p>
                    <p className={`text-2xl font-bold ${colors.text}`}>{count}</p>
                    <p className="text-xs text-muted-foreground">{fr.segmentDetail.accountCount}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

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

      {/* Top accounts: at risk + expansion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopAccountsCard
          title={fr.dashboard.topAtRisk}
          icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
          accounts={topAccounts?.atRisk || []}
          scoreField="churn_risk_score"
          emptyText={`0 ${fr.dashboard.accountsAtRisk.toLowerCase()}`}
          viewAllHref="/segments/en_danger_critique"
          borderClass="border-destructive/30"
        />
        <TopAccountsCard
          title={fr.dashboard.topExpansion}
          icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
          accounts={topAccounts?.expansion || []}
          scoreField="expansion_score"
          emptyText={`0 ${fr.dashboard.expansionOpportunities.toLowerCase()}`}
          viewAllHref="/segments/en_expansion"
          borderClass="border-blue-200"
        />
      </div>

      {/* MRR chart */}
      <MrrChart />

      {/* Recent syncs */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{fr.dashboard.recentSyncs}</CardTitle>
            <Link to="/syncs" className="text-sm text-primary hover:underline flex items-center gap-1">
              {fr.dashboard.viewAll} <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentSyncs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              {fr.dashboard.noSyncs}{' '}
              <Link to="/settings/integrations" className="text-primary hover:underline">
                {fr.nav.settings}
              </Link>
            </p>
          ) : (
            <div className="space-y-2">
              {recentSyncs.map(sync => (
                <div key={sync.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <Badge variant={sync.sync_status === 'completed' ? 'default' : sync.sync_status === 'failed' ? 'destructive' : 'secondary'} className="text-xs">
                      {sync.sync_status}
                    </Badge>
                    <span className="text-muted-foreground">{sync.sync_source}</span>
                    <span className="text-muted-foreground">{sync.sync_type}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {sync.records_processed != null && <span>{sync.records_processed} enr.</span>}
                    <span>{fr.format.date(sync.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TopAccountsCard({
  title,
  icon,
  accounts,
  scoreField,
  emptyText,
  viewAllHref,
  borderClass,
}: {
  title: string;
  icon: React.ReactNode;
  accounts: TopAccount[];
  scoreField: 'churn_risk_score' | 'expansion_score';
  emptyText: string;
  viewAllHref: string;
  borderClass: string;
}) {
  return (
    <Card className={borderClass}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">{emptyText}</p>
        ) : (
          <div className="space-y-2">
            {accounts.map(a => (
              <Link
                key={a.id}
                to={`/accounts/${a.id}`}
                className="flex items-center justify-between py-1.5 hover:bg-muted/50 rounded px-2 -mx-2 transition-colors"
              >
                <span className="font-mono text-xs text-muted-foreground truncate max-w-[200px]">
                  {a.stripe_customer_id}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{fr.format.currency(a.mrr_cents)}</span>
                  <ScoreBadge score={a[scoreField]} inverted={scoreField === 'churn_risk_score'} />
                </div>
              </Link>
            ))}
            <Link
              to={viewAllHref}
              className="flex items-center justify-end gap-1 text-sm text-primary hover:underline pt-1"
            >
              {fr.dashboard.viewAll} <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
