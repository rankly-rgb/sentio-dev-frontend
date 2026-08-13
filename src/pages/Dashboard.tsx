import { Link, useNavigate } from 'react-router-dom';
import { getAccountLabel } from '@/lib/account-display';
import { useEffect, useState } from 'react';
import { useOnboardingFlowStatus } from '@/hooks/useOnboardingFlow';
import { useOnboardingStatusV2 } from '@/hooks/useOnboardingV2';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useManualSync } from '@/hooks/useManualSync';
import { useIntegrationStatus } from '@/hooks/useIntegrations';
import { useSegments } from '@/hooks/useSegments';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { useAccountDetailPanel } from '@/hooks/useAccountDetailPanel';
import { useT } from '@/lib/i18n/useT';
import { useAuth } from '@/contexts/AuthContext';
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
  // Info, // V2 - HubSpot : utilisé dans le message hubspotInfo (commenté)
  ChevronRight,
  AlertTriangle,
  TrendingUp,
  // ChevronUp,   // V2 - setup widget (commenté)
  // ChevronDown, // V2 - setup widget (commenté)
} from 'lucide-react';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { TrackerBanner } from '@/components/dashboard/tracker-banner';
import { StripeStaleBanner, BillingProfileNeedsReviewBanner } from '@/components/dashboard/degraded-state-banners';
import { BenchmarkSection } from '@/components/dashboard/BenchmarkSection';
import { useBenchmarkData } from '@/hooks/useBenchmarkData';
import { SEGMENT_COLORS } from '@/lib/types/segments';
import { useSegmentLabels } from '@/lib/i18n/useSegmentLabels';
import type { TopAccount, TopAccountsResult } from '@/hooks/useDashboardData';

const QUICK_SEGMENTS = ['champions', 'en_expansion', 'stables', 'a_risque_leger'] as const;

/* V2 - setup widget : masqué en V1 (onboarding_completed non fiable pour les clients existants)
const STEP_ORDER = ['promise', 'stripe', 'revelation', 'invested', 'hubspot', 'completed'] as const;
function stepIndex(step: string): number {
  return STEP_ORDER.indexOf(step as (typeof STEP_ORDER)[number]);
}
*/

// ── Demo banner ───────────────────────────────────────────────────
function DemoBanner() {
  const fr = useT();
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm text-amber-800">
      <span>{fr.onboardingV2.dashboard.demoBanner}</span>
      <Link to="/onboarding?resume=stripe" className="font-medium underline underline-offset-2 whitespace-nowrap">
        {fr.onboardingV2.dashboard.demoConnectStripe}
      </Link>
    </div>
  );
}

/* V2 - setup widget (suite)
function SetupWidget({ onboardingStep }: { onboardingStep: string }) {
  const fr = useT();
  const [expanded, setExpanded] = useState(false);
  const idx = stepIndex(onboardingStep);

  const stripeConnected = idx > 1;
  const personalizationDone = idx > 3;
  const progressPct = Math.round((idx / (STEP_ORDER.length - 1)) * 100);

  return (
    <div className="fixed bottom-6 right-6 z-40 w-52 shadow-lg rounded-xl overflow-hidden border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="text-xs font-medium text-gray-700">{fr.onboardingV2.dashboard.setupTitle} {progressPct}%</span>
        {expanded ? <ChevronDown className="h-3.5 w-3.5 text-gray-400" /> : <ChevronUp className="h-3.5 w-3.5 text-gray-400" />}
      </button>
      <div className="h-1 bg-gray-100">
        <div className="h-full bg-[#3b5bdb] transition-all" style={{ width: `${progressPct}%` }} />
      </div>
      {expanded && (
        <div className="p-3 space-y-2 text-xs border-t border-gray-100">
          {[
            { label: fr.onboardingV2.dashboard.setupStep1, done: true },
            {
              label: stripeConnected ? fr.onboardingV2.dashboard.setupStep2Done : fr.onboardingV2.dashboard.setupStep2Todo,
              done: stripeConnected,
              href: stripeConnected ? undefined : '/onboarding',
            },
            {
              label: personalizationDone ? fr.onboardingV2.dashboard.setupStep3Done : fr.onboardingV2.dashboard.setupStep3Todo,
              done: personalizationDone,
              href: personalizationDone ? undefined : '/onboarding',
            },
            {
              label: fr.onboardingV2.dashboard.setupStep4Todo,
              done: false,
              href: '/settings/integrations',
            },
          ].map(({ label, done, href }, i) => (
            <div key={i} className={`flex items-center gap-2 ${done ? 'text-gray-500' : 'text-[#3b5bdb]'}`}>
              <CheckCircle className={`h-3.5 w-3.5 flex-shrink-0 ${done ? 'text-emerald-500' : 'text-gray-200'}`} />
              {href && !done ? (
                <Link to={href} className="hover:underline truncate">{label}</Link>
              ) : (
                <span className="truncate">{label}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
*/

// ── Re-visit tooltip ──────────────────────────────────────────────
function RevisitTooltip() {
  const fr = useT();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const already = localStorage.getItem('sentio_v2_revisit_shown');
    if (already) return;

    const isSecondSession = localStorage.getItem('sentio_v2_visited');
    if (!isSecondSession) {
      localStorage.setItem('sentio_v2_visited', '1');
      return;
    }

    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!visible) return;
    localStorage.setItem('sentio_v2_revisit_shown', '1');
    const dismiss = setTimeout(() => setVisible(false), 6000);
    return () => clearTimeout(dismiss);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-6 z-40 max-w-xs bg-[#1a1f3e] text-white text-sm rounded-xl px-4 py-3 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
      {fr.onboardingV2.dashboard.revisitTooltip}
    </div>
  );
}

export default function Dashboard() {
  const fr = useT();
  const { user } = useAuth();
  const segmentLabels = useSegmentLabels();
  const navigate = useNavigate();
  const { data: onboardingStatus } = useOnboardingFlowStatus();
  const { data: v2Status } = useOnboardingStatusV2();

  useEffect(() => {
    if (onboardingStatus && onboardingStatus.onboarding_completed === false) {
      navigate('/onboarding/promise', { replace: true });
    }
  }, [onboardingStatus, navigate]);

  const { metrics, distribution, topAccounts, isLoading, error, refetch } = useDashboardData();
  // metrics.currency (portfolio-metrics, autoritaire) une fois chargé ; le
  // fallback user?.currency ne joue que pendant la fenêtre de chargement.
  const currency = metrics?.currency ?? user?.currency ?? 'usd';
  // V2 - HubSpot : triggerHubspotSync aliasé pour satisfaire noUnusedLocals
  const { triggerStripeSync, triggerHubspotSync: _triggerHubspotSync, calculateScores, isSyncing, isSyncingHubspot, isCalculating } = useManualSync();
  const { data: integrationStatus } = useIntegrationStatus();
  const { data: segments } = useSegments();
  const { data: syncs } = useSyncStatus();
  const { organization } = useOrganizationSettings();
  const trackerConnected = organization?.usage_tracker_connected ?? false;
  const { isOpen, account: panelAccount, isLoading: panelLoading, openPanel, closePanel } = useAccountDetailPanel();
  const { data: benchmarkData, isLoading: benchmarkLoading, error: benchmarkError } = useBenchmarkData();

  async function handleSync() {
    await triggerStripeSync('incremental');
    refetch();
  }

  /* V2 - HubSpot
  async function handleHubspotSync() {
    await _triggerHubspotSync('daily');
    refetch();
  }
  */

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

  const showDemoBanner = v2Status?.has_demo_data === true && v2Status?.onboarding_completed === false;
  // V2 - setup widget masqué en V1 : const showSetupWidget = v2Status?.onboarding_completed === false;
  const showRevisitTooltip = v2Status?.first_revelation_done === true;

  return (
    <div className="space-y-6 p-6">
      {/* V2 demo banner */}
      {showDemoBanner && <DemoBanner />}

      {/* Tracker banner */}
      {!trackerConnected && <TrackerBanner />}

      {/* Degraded states — stale Stripe sync / non-standard billing config */}
      {metrics?.stripe_stale && <StripeStaleBanner onSync={handleSync} isSyncing={isSyncing} />}
      {metrics?.billing_profile === 'needs_review' && <BillingProfileNeedsReviewBanner />}

      {/* Critical accounts alert banner */}
      {(topAccounts?.atRiskTotalCount ?? 0) > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <div>
            <span className="font-semibold text-red-700">
              {fr.dashboard.criticalAlertTitle(topAccounts!.atRiskTotalCount)}
            </span>
            <span className="text-red-600 ml-2">
              {fr.dashboard.criticalAlertMrr(
                fr.format.currency(topAccounts!.atRiskTotalMrrCents, currency)
              )}
            </span>
          </div>
          <Link
            to="/dashboard/segments/critical"
            className="text-red-700 font-medium hover:underline text-sm whitespace-nowrap ml-4"
          >
            {fr.dashboard.criticalAlertCta}
          </Link>
        </div>
      )}

      {/* V2 setup progression widget — masqué en V1 (onboarding_completed non fiable)
      {showSetupWidget && v2Status && <SetupWidget onboardingStep={v2Status.onboarding_step} />}
      */}

      {/* V2 re-visit tooltip */}
      {showRevisitTooltip && <RevisitTooltip />}

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

          {/* V2 - HubSpot
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
          */}

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

      {/* Integration status banner — V1 : Stripe uniquement */}
      {integrationStatus && (
        <div className="flex flex-wrap items-center gap-3">
          {/* V2 - lien → /settings/integrations quand la route sera réactivée */}
          <Link to="/settings">
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
          {/* V2 - HubSpot
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
          */}
        </div>
      )}

      {/* KPI cards */}
      {metrics && <KpiCards metrics={metrics} />}
      {metrics && metrics.mrr_unavailable_accounts > 0 && (
        <p className="text-xs text-muted-foreground -mt-4">
          {fr.dashboard.mrrUnavailableNote(metrics.mrr_unavailable_accounts)}
        </p>
      )}

      {/* Benchmarks sectoriels */}
      <BenchmarkSection data={benchmarkData ?? null} isLoading={benchmarkLoading} error={benchmarkError} />

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
                    <p className={`text-xs font-medium ${colors.text}`}>{segmentLabels[key]}</p>
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
              <ScoreGauge
                value={metrics.avg_health_score}
                label={fr.scores.healthScore}
                sublabel={fr.dashboard.avgHealthDenominator(metrics.avg_health_scored_accounts, metrics.total_accounts)}
                color="hsl(var(--primary))"
              />
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
          currency={currency}
        />
        <ExpansionCard
          topAccounts={topAccounts}
          onAccountClick={openPanel}
          currency={currency}
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
  currency,
}: {
  title: string;
  icon: React.ReactNode;
  accounts: TopAccount[];
  scoreField: 'churn_risk_score' | 'expansion_score';
  emptyText: string;
  viewAllHref: string;
  borderClass: string;
  onAccountClick?: (id: string) => void;
  currency: string;
}) {
  const fr = useT();
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
                <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {getAccountLabel(a)}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{fr.format.mrrOrUnavailable(a.mrr_cents, currency, a.mrr_status === 'unavailable')}</span>
                  <ScoreBadge
                    score={a[scoreField]}
                    band={scoreField === 'churn_risk_score' ? a.churn_risk_band : undefined}
                    type={scoreField === 'churn_risk_score' ? 'churn' : 'expansion'}
                    inverted={scoreField === 'churn_risk_score'}
                  />
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
  currency,
}: {
  topAccounts: TopAccountsResult | null;
  onAccountClick?: (id: string) => void;
  currency: string;
}) {
  const fr = useT();
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
            {fr.dashboard.expansionContext(totalCount, fr.format.currency(totalMrrCents, currency))}
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
                <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                  {getAccountLabel(a)}
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
                  <span className="text-xs text-muted-foreground">{fr.format.mrrOrUnavailable(a.mrr_cents, currency, a.mrr_status === 'unavailable')}</span>
                  {/* Score */}
                  <ScoreBadge score={a.expansion_score} type="expansion" />
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
