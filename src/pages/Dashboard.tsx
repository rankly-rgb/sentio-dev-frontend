import { Link } from 'react-router-dom';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useManualSync } from '@/hooks/useManualSync';
import { useIntegrationStatus } from '@/hooks/useIntegrations';
import { useSegments } from '@/hooks/useSegments';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { useAccountDetailPanel } from '@/hooks/useAccountDetailPanel';
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
import AccountDetailPanel from '@/components/account-detail/AccountDetailPanel';
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
import { BenchmarkSection } from '@/components/dashboard/BenchmarkSection';
import { useBenchmarkData } from '@/hooks/useBenchmarkData';
import { SEGMENT_LABELS, SEGMENT_COLORS } from '@/lib/types/segments';
import type { TopAccount, TopAccountsResult } from '@/hooks/useDashboardData';

const QUICK_SEGMENTS = ['champions', 'en_expansion', 'stables', 'a_risque_leger'] as const;

export default function Dashboard() {
  const { metrics, distribution, topAccounts, isLoading, error, refetch } = useDashboardData();
  const { triggerStripeSync, triggerHubspotSync, calculateScores, isSyncing, isSyncingHubspot, isCalculating } = useManualSync();
  const { data: integrationStatus } = useIntegrationStatus();
  const { data: segments } = useSegments();
  const { data: syncs } = useSyncStatus();
  const { organization } = useOrganizationSettings();
  const trackerConnected = organization?.usage_tracker_connected ?? false;
  const { isOpen, account: panelAccount, isLoading: panelLoading, openPanel, closePanel } = useAccountDetailPanel();
  const { data: benchmarkData, isLoading: benchmarkLoading } = useBenchmarkData();

  async function handleSync() {
    await triggerStripeSync('incremental');
    refetch();
  }

  async function handleHubspotSync() {
    await triggerHubspotSync('daily');
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
            disabled={isSyncing || isSyncingHubspot || isCalculating}
            aria-label="Lancer sync Stripe"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? fr.dashboard.syncInProgress : 'Sync Stripe'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleHubspotSync}
            disabled={isSyncing || isSyncingHubspot || isCalculating}
            aria-label="Lancer sync HubSpot"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncingHubspot ? 'animate-spin' : ''}`} />
            {isSyncingHubspot ? fr.dashboard.syncInProgress : 'Sync HubSpot'}
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleCalculate}
            disabled={isSyncing || isSyncingHubspot || isCalculating}
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

      {/* Benchmarks sectoriels */}
      <BenchmarkSection data={benchmarkData ?? null} isLoading={benchmarkLoading} />

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
                    <p className={`text-2xl font-bold ${colors.text}`}>{fr.format.number(count)}</p>
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
          onAccountClick={openPanel}
        />
        <ExpansionCard
          topAccounts={topAccounts}
          onAccountClick={openPanel}
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
                    {sync.records_processed != null && <span>{fr.format.number(sync.records_processed)} enr.</span>}
                    <span>{fr.format.date(sync.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AccountDetailPanel
        isOpen={isOpen}
        onClose={closePanel}
        account={panelAccount}
        isLoading={panelLoading}
      />
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
  onAccountClick,
}: {
  title: string;
  icon: React.ReactNode;
  accounts: TopAccount[];
  scoreField: 'churn_risk_score' | 'expansion_score';
  emptyText: string;
  viewAllHref: string;
  borderClass: string;
  onAccountClick?: (id: string) => void;
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
              <button
                key={a.id}
                type="button"
                onClick={() => onAccountClick?.(a.id)}
                className="flex w-full items-center justify-between py-1.5 hover:bg-muted/50 rounded px-2 -mx-2 transition-colors text-left"
              >
                <span className="font-mono text-xs text-muted-foreground truncate max-w-[200px]">
                  {a.stripe_customer_id}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{fr.format.currency(a.mrr_cents)}</span>
                  <ScoreBadge score={a[scoreField]} inverted={scoreField === 'churn_risk_score'} />
                </div>
              </button>
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

function SeatProgressBar({ count, limit }: { count: number; limit: number }) {
  const pct = limit > 0 ? Math.round((count / limit) * 100) : 0;
  const color = pct >= 90 ? 'bg-destructive' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground whitespace-nowrap">{count}/{limit}</span>
      <div className="w-12 h-1 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}

function ExpansionCard({
  topAccounts,
  onAccountClick,
}: {
  topAccounts: TopAccountsResult | null;
  onAccountClick?: (id: string) => void;
}) {
  const accounts = topAccounts?.expansion || [];
  const totalCount = topAccounts?.expansionTotalCount ?? 0;
  const totalMrrCents = topAccounts?.expansionTotalMrrCents ?? 0;

  return (
    <Card className="border-blue-200">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          <CardTitle className="text-base">{fr.dashboard.topExpansion}</CardTitle>
        </div>
        {totalCount > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {fr.dashboard.expansionContext(totalCount, fr.format.currency(totalMrrCents))}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            {fr.dashboard.expansionEmptyDetail}
          </p>
        ) : (
          <div className="space-y-2">
            {accounts.map(a => (
              <button
                key={a.id}
                type="button"
                onClick={() => onAccountClick?.(a.id)}
                className="flex w-full items-center justify-between py-1.5 hover:bg-muted/50 rounded px-2 -mx-2 transition-colors text-left gap-2"
              >
                <span className="font-mono text-xs text-muted-foreground truncate max-w-[140px]">
                  {a.stripe_customer_id}
                </span>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {/* Seats */}
                  {a.seat_count != null && a.seat_limit != null ? (
                    <SeatProgressBar count={a.seat_count} limit={a.seat_limit} />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                  {/* Plan */}
                  {a.plan_tier && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {a.plan_tier}
                    </Badge>
                  )}
                  {/* MRR */}
                  <span className="text-xs text-muted-foreground">{fr.format.currency(a.mrr_cents)}</span>
                  {/* Score */}
                  <ScoreBadge score={a.expansion_score} />
                </div>
              </button>
            ))}
            <Link
              to="/segments/en_expansion"
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
