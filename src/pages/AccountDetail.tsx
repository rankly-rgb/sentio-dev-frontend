import { useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAccountDetail } from '@/hooks/useAccountDetail';
import { useManualSync } from '@/hooks/useManualSync';
import { useInsights, useUpdateInsightStatus } from '@/hooks/useInsights';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { useRemoveAccountFlag } from '@/hooks/useAccountFlags';
import AccountFlagsBadges from '@/components/accounts/AccountFlagsBadges';
import AccountNotesSection from '@/components/accounts/AccountNotesSection';
import { fr } from '@/i18n/fr';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import ScoreBadge from '@/components/ScoreBadge';
import InsightCard from '@/components/insights/InsightCard';
import { ArrowLeft, Calculator, BrainCircuit, BarChart3 } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { ScoreHistoryItem } from '@/lib/types/accounts';
import { SEGMENT_COLORS, SEGMENT_LABELS } from '@/lib/types/segments';

// ─── Helpers ────────────────────────────────────────────────────────────────

function subscriptionStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'active': return 'default';
    case 'trialing': return 'secondary';
    case 'canceled':
    case 'past_due': return 'destructive';
    default: return 'outline';
  }
}

function invoiceStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'paid': return 'default';
    case 'open': return 'secondary';
    case 'uncollectible': return 'destructive';
    default: return 'outline';
  }
}

function formatScoreHistory(history: ScoreHistoryItem[], days: number) {
  const cutoff = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
  return [...history]
    .filter(h => h.snapshot_date >= cutoff)
    .sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date))
    .map(h => ({
      date: h.snapshot_date.slice(5),
      Santé: h.health_score,
      Churn: h.churn_risk_score,
      Expansion: h.expansion_score,
    }));
}

/** Score gauge color based on value (0-100) */
function scoreProgressColor(value: number, inverted: boolean): string {
  const v = Math.round(value);
  if (!inverted) {
    if (v >= 71) return 'bg-green-500';
    if (v >= 51) return 'bg-yellow-500';
    if (v >= 31) return 'bg-orange-500';
    return 'bg-red-500';
  }
  // Inverted (churn risk): high = bad
  if (v >= 71) return 'bg-red-500';
  if (v >= 51) return 'bg-orange-500';
  if (v >= 31) return 'bg-yellow-500';
  return 'bg-green-500';
}

function ScoreBreakdown({ score, label, weight, healthScore }: {
  score: number | null;
  label: string;
  weight: string;
  healthScore: number | null;
}) {
  const isNull = score === null || score === undefined;
  const hasHealthScore = healthScore !== null && healthScore !== undefined;

  // Determine display text for null values
  let displayText: string;
  if (!isNull) {
    displayText = `${Math.round(score)}/100`;
  } else if (hasHealthScore) {
    displayText = `${fr.accountDetail.scoreNotCalculated}`;
  } else {
    displayText = fr.accountDetail.noScores;
  }

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {isNull ? (
            <span className="text-muted-foreground">— /100</span>
          ) : (
            displayText
          )}
          {' '}
          <span className="text-xs text-muted-foreground">×{weight}</span>
        </span>
      </div>
      {isNull ? (
        <Progress value={0} className="h-2 opacity-40" />
      ) : (
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={`h-full transition-all ${scoreProgressColor(score, false)}`}
            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function AccountDetail() {
  const { accountId } = useParams();
  const navigate = useNavigate();
  const { data: account, isLoading, error } = useAccountDetail(accountId);
  const { organization } = useOrganizationSettings();
  const trackerConnected = organization?.usage_tracker_connected ?? false;
  const { calculateScores, isCalculating } = useManualSync();
  const removeFlag = useRemoveAccountFlag();
  const [historyDays, setHistoryDays] = useState<30 | 60 | 90>(30);

  // Account insights
  const { data: insightsData } = useInsights({
    account_id: accountId,
    per_page: 5,
  });
  const updateInsightStatus = useUpdateInsightStatus();
  const handleAcknowledge = useCallback((id: string) => {
    updateInsightStatus.mutate({ id, status: 'acknowledged' });
  }, [updateInsightStatus]);
  const handleDismiss = useCallback((id: string) => {
    updateInsightStatus.mutate({ id, status: 'dismissed' });
  }, [updateInsightStatus]);

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate('/accounts')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> {fr.common.back}
        </Button>
        <p className="mt-4 text-muted-foreground">{fr.accountDetail.noData}</p>
      </div>
    );
  }

  const chartData = formatScoreHistory(account.score_history, historyDays);
  const primarySegment = account.segments[0]?.account_segments;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/accounts')} aria-label={fr.common.back}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-mono">{account.stripe_customer_id}</h1>
            <div className="flex gap-2 mt-1 flex-wrap items-center">
              {/* Segment badge */}
              {primarySegment && (
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${SEGMENT_COLORS[primarySegment.segment_type]?.text ?? 'text-gray-700'} ${SEGMENT_COLORS[primarySegment.segment_type]?.bg ?? 'bg-gray-100'}`}>
                  {SEGMENT_LABELS[primarySegment.segment_type] ?? primarySegment.segment_name}
                </span>
              )}
              {/* Subscription status */}
              {account.subscriptions[0] && (
                <Badge variant={subscriptionStatusVariant(account.subscriptions[0].status)}>
                  {account.subscriptions[0].status}
                </Badge>
              )}
              <p className="text-sm text-muted-foreground">
                {fr.accountDetail.createdAt} {fr.format.date(account.created_at)}
              </p>
            </div>
            {account.flags.length > 0 && (
              <AccountFlagsBadges
                flags={account.flags}
                onRemove={(flagName) => removeFlag.mutate({ accountId: account.id, flagName })}
                isRemoving={removeFlag.isPending}
              />
            )}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => calculateScores()}
          disabled={isCalculating}
          aria-label={fr.accountDetail.recalculateScores}
        >
          <Calculator className={`h-4 w-4 mr-2 ${isCalculating ? 'animate-spin' : ''}`} />
          {isCalculating ? fr.accountDetail.recalculating : fr.accountDetail.recalculateScores}
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">{fr.accounts.mrr}</p>
            <p className="text-xl font-bold">{fr.format.currency(account.mrr_cents)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">{fr.scores.healthScore}</p>
            <ScoreBadge score={account.health_score} size="lg" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">{fr.scores.churnRisk}</p>
            <ScoreBadge score={account.churn_risk_score} inverted size="lg" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">{fr.scores.expansionScore}</p>
            <ScoreBadge score={account.expansion_score} size="lg" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">{fr.scores.productUsage}</p>
            {!trackerConnected ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-2xl font-bold text-muted-foreground cursor-help">—</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{fr.integrations.tracker.usageScoreUnavailable}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <ScoreBadge score={account.product_usage_score} size="lg" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Score breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{fr.accountDetail.scoreBreakdown}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {trackerConnected ? (
            <ScoreBreakdown score={account.product_usage_score} label={fr.scores.productUsage} weight="35%" healthScore={account.health_score} />
          ) : (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <BarChart3 className="h-4 w-4" />
                  <span>{fr.scores.productUsage}</span>
                </div>
                <Badge variant="secondary" className="bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-50">
                  {fr.integrations.tracker.comingSoon}
                </Badge>
              </div>
              <p className="text-xs text-gray-400">{fr.integrations.tracker.breakdownPlaceholder}</p>
              <div className="flex justify-end">
                <Link
                  to="/settings/integrations#tracker"
                  className="text-xs text-blue-600 hover:underline"
                >
                  {fr.integrations.tracker.connectCta}
                </Link>
              </div>
            </div>
          )}
          <ScoreBreakdown score={account.financial_score} label={fr.scores.financialHealth} weight={trackerConnected ? '25%' : '34%'} healthScore={account.health_score} />
          <ScoreBreakdown score={account.engagement_score} label={fr.scores.engagementScore} weight={trackerConnected ? '20%' : '33%'} healthScore={account.health_score} />
          <ScoreBreakdown score={account.contract_score} label={fr.scores.contractScore} weight={trackerConnected ? '20%' : '33%'} healthScore={account.health_score} />
        </CardContent>
      </Card>

      {/* Onglets */}
      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history">{fr.accountDetail.scoreHistory}</TabsTrigger>
          <TabsTrigger value="overview">{fr.accountDetail.overview}</TabsTrigger>
          <TabsTrigger value="subscriptions">{fr.accountDetail.subscriptions}</TabsTrigger>
          <TabsTrigger value="invoices">{fr.accountDetail.invoices}</TabsTrigger>
          <TabsTrigger value="usage">{fr.accountDetail.usage}</TabsTrigger>
          <TabsTrigger value="insights" className="gap-1">
            <BrainCircuit className="h-3.5 w-3.5" />
            {fr.insights.accountInsightsTitle}
            {(insightsData?.data?.length ?? 0) > 0 && (
              <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {insightsData?.data?.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="notes">{fr.accountDetail.notes}</TabsTrigger>
          <TabsTrigger value="hubspot">{fr.accountDetail.hubspot}</TabsTrigger>
        </TabsList>

        {/* Historique des scores */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>{fr.accountDetail.scoreEvolution}</CardTitle>
              <div className="flex gap-1">
                {([30, 60, 90] as const).map(d => (
                  <Button
                    key={d}
                    variant={historyDays === d ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setHistoryDays(d)}
                  >
                    {fr.accountDetail[`scoreHistory${d}` as keyof typeof fr.accountDetail] as string}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <p className="text-muted-foreground text-sm">{fr.accountDetail.noData}</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <RechartsTooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      formatter={(v: number | string) => [typeof v === 'number' ? `${Math.round(v)}/100` : '—']}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="Santé" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} connectNulls />
                    <Line type="monotone" dataKey="Churn" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} connectNulls />
                    <Line type="monotone" dataKey="Expansion" stroke="#22c55e" strokeWidth={2} dot={false} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>{fr.accountDetail.contractPeriod}</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{fr.accountDetail.plan}</span>
                  <span className="font-medium">{account.plan_tier ? fr.accounts[account.plan_tier as keyof typeof fr.accounts] ?? account.plan_tier : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{fr.accountDetail.billingInterval}</span>
                  <span className="font-medium">
                    {account.billing_interval === 'monthly' ? fr.accounts.monthly : account.billing_interval === 'annual' ? fr.accounts.annual : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{fr.accountDetail.contractStart}</span>
                  <span className="font-medium">{account.contract_start_date ? fr.format.date(account.contract_start_date) : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{fr.accountDetail.contractEnd}</span>
                  <span className="font-medium">{account.contract_end_date ? fr.format.date(account.contract_end_date) : '—'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>{fr.accountDetail.seatUsage}</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>{account.seat_count ?? 0} / {account.seat_limit ?? '∞'} {fr.accounts.seats.toLowerCase()}</p>
                {account.seat_count != null && account.seat_limit != null ? (
                  <Progress value={(account.seat_count / account.seat_limit) * 100} className="h-2" />
                ) : null}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader><CardTitle>{fr.accountDetail.activeSegments}</CardTitle></CardHeader>
              <CardContent>
                {account.segments.length === 0 ? (
                  <p className="text-muted-foreground text-sm">{fr.accountDetail.noSegments}</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {account.segments.map(seg => {
                      const st = seg.account_segments.segment_type;
                      return (
                        <span
                          key={seg.segment_id}
                          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${SEGMENT_COLORS[st]?.text ?? 'text-gray-700'} ${SEGMENT_COLORS[st]?.bg ?? 'bg-gray-100'}`}
                        >
                          {SEGMENT_LABELS[st] ?? seg.account_segments.segment_name}
                        </span>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Abonnements */}
        <TabsContent value="subscriptions" className="mt-4">
          <Card>
            <CardContent className="p-4">
              {account.subscriptions.length === 0 ? (
                <p className="text-muted-foreground">{fr.accountDetail.noData}</p>
              ) : (
                <div className="space-y-3">
                  {account.subscriptions.map(sub => (
                    <div key={sub.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-mono text-sm">{sub.stripe_sub_id}</p>
                        <Badge variant={subscriptionStatusVariant(sub.status)} className="mt-1">
                          {sub.status}
                        </Badge>
                        {sub.trial_end_date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {fr.accountDetail.trialEnds} : {fr.format.date(sub.trial_end_date)}
                          </p>
                        )}
                        {sub.cancel_at && (
                          <p className="text-xs text-orange-600 mt-1">
                            {fr.accountDetail.cancelsAt} : {fr.format.date(sub.cancel_at)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{fr.format.currency(sub.mrr_cents)}/mois</p>
                        <p className="text-xs text-muted-foreground">{sub.quantity} siège(s)</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Factures */}
        <TabsContent value="invoices" className="mt-4">
          <Card>
            <CardContent className="p-4">
              {account.recent_invoices.length === 0 ? (
                <p className="text-muted-foreground">{fr.accountDetail.noData}</p>
              ) : (
                <div className="space-y-2">
                  {account.recent_invoices.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-mono text-sm">{inv.stripe_invoice_id}</p>
                        <p className="text-xs text-muted-foreground">{fr.format.date(inv.invoice_date)}</p>
                        {inv.due_date && (
                          <p className="text-xs text-muted-foreground">
                            {fr.accountDetail.dueDate} : {fr.format.date(inv.due_date)}
                          </p>
                        )}
                        {inv.paid_at && (
                          <p className="text-xs text-green-600">
                            {fr.accountDetail.paidAt} {fr.format.date(inv.paid_at)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{fr.format.currency(inv.amount_cents)}</p>
                        <Badge variant={invoiceStatusVariant(inv.status)}>{inv.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage produit */}
        <TabsContent value="usage" className="mt-4">
          <Card>
            <CardContent className="p-4">
              {account.recent_usage.length === 0 ? (
                <p className="text-muted-foreground">{fr.accountDetail.noData}</p>
              ) : (
                <div className="space-y-2">
                  {account.recent_usage.map((event, i) => (
                    <div key={i} className="flex items-center justify-between p-2 text-sm border-b last:border-0">
                      <div>
                        <span className="font-medium">{event.event_type}</span>
                        {event.feature_name && (
                          <span className="text-muted-foreground ml-2">({event.feature_name})</span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-medium">{event.event_count}×</span>
                        <span className="text-muted-foreground ml-2">{fr.format.date(event.event_date)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights IA */}
        <TabsContent value="insights" className="mt-4">
          {!insightsData?.data || insightsData.data.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <BrainCircuit className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">{fr.insights.noInsights}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {insightsData.data.map(insight => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  onAcknowledge={handleAcknowledge}
                  onDismiss={handleDismiss}
                  isUpdating={updateInsightStatus.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Notes */}
        <TabsContent value="notes" className="mt-4">
          <AccountNotesSection accountId={account.id} />
        </TabsContent>

        {/* HubSpot */}
        <TabsContent value="hubspot" className="mt-4">
          <Card>
            <CardHeader><CardTitle>{fr.accountDetail.hubspot}</CardTitle></CardHeader>
            <CardContent>
              {!account.hubspot_data ? (
                <p className="text-muted-foreground">{fr.accountDetail.hubspotNoData}</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground">{fr.accountDetail.hubspotLifecycle}</p>
                      <p className="text-sm font-medium mt-1">{account.hubspot_data.lifecycle_stage ?? '—'}</p>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground">{fr.accountDetail.hubspotDeals}</p>
                      <p className="text-2xl font-bold">{account.hubspot_data.open_deal_count ?? 0}</p>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground">{fr.accountDetail.hubspotTickets}</p>
                      <p className="text-2xl font-bold">{account.hubspot_data.open_ticket_count ?? 0}</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground">{fr.accountDetail.hubspotLastMeeting}</p>
                      <p className="text-sm font-medium mt-1">
                        {account.hubspot_data.last_meeting_date ? fr.format.date(account.hubspot_data.last_meeting_date) : '—'}
                      </p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground">{fr.accountDetail.hubspotLastEmail}</p>
                      <p className="text-sm font-medium mt-1">
                        {account.hubspot_data.last_email_date ? fr.format.date(account.hubspot_data.last_email_date) : '—'}
                      </p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-xs text-muted-foreground">{fr.accountDetail.hubspotLastSync}</p>
                      <p className="text-sm font-medium mt-1">
                        {account.hubspot_data.last_synced_at ? fr.format.dateTime(account.hubspot_data.last_synced_at) : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
