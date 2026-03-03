import { useParams, useNavigate } from 'react-router-dom';
import { useAccountDetail } from '@/hooks/useAccountDetail';
import { useManualSync } from '@/hooks/useManualSync';
import { fr } from '@/i18n/fr';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import ScoreBadge from '@/components/ScoreBadge';
import { ArrowLeft, Calculator } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { ScoreHistoryItem } from '@/lib/types/accounts';

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

function formatScoreHistory(history: ScoreHistoryItem[]) {
  return [...history]
    .sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date))
    .map(h => ({
      date: h.snapshot_date.slice(5),
      Santé: h.health_score,
      Churn: h.churn_risk_score,
      Expansion: h.expansion_score,
    }));
}

function ScoreBreakdown({ score, label, weight }: {
  score: number | null;
  label: string;
  weight: string;
}) {
  const value = score ?? 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {Math.round(value)}/100 <span className="text-xs text-muted-foreground">×{weight}</span>
        </span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function AccountDetail() {
  const { accountId } = useParams();
  const navigate = useNavigate();
  const { data: account, isLoading, error } = useAccountDetail(accountId);
  const { calculateScores, isCalculating } = useManualSync();

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
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

  const chartData = formatScoreHistory(account.score_history);

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
            <div className="flex gap-2 mt-1 flex-wrap">
              {account.subscriptions[0] && (
                <Badge variant={subscriptionStatusVariant(account.subscriptions[0].status)}>
                  {account.subscriptions[0].status}
                </Badge>
              )}
              <p className="text-sm text-muted-foreground">
                Créé le {fr.format.date(account.created_at)}
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => calculateScores()}
          disabled={isCalculating}
          aria-label="Recalculer les scores pour ce compte"
        >
          <Calculator className={`h-4 w-4 mr-2 ${isCalculating ? 'animate-spin' : ''}`} />
          Recalculer les scores
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
            <ScoreBadge score={account.product_usage_score} size="lg" />
          </CardContent>
        </Card>
      </div>

      {/* Score breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Décomposition du score de santé</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ScoreBreakdown score={account.product_usage_score} label={fr.scores.productUsage} weight="35%" />
          <ScoreBreakdown score={null} label={fr.scores.financialHealth} weight="25%" />
          <ScoreBreakdown score={null} label={fr.scores.engagementScore} weight="20%" />
          <ScoreBreakdown score={null} label={fr.scores.contractScore} weight="20%" />
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
          <TabsTrigger value="hubspot">{fr.accountDetail.hubspot}</TabsTrigger>
        </TabsList>

        {/* Historique des scores — graphique Recharts */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Évolution des scores — 30 jours</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <p className="text-muted-foreground text-sm">{fr.accountDetail.noData}</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      formatter={(v: number) => [`${Math.round(v)}/100`]}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="Santé" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Churn" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Expansion" stroke="#22c55e" strokeWidth={2} dot={false} />
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
                <p>Fin de contrat : {account.contract_end_date ? fr.format.date(account.contract_end_date) : '-'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>{fr.accountDetail.seatUsage}</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>{account.seat_count ?? 0} / {account.seat_limit ?? '∞'} {fr.accounts.seats.toLowerCase()}</p>
                {account.seat_count && account.seat_limit ? (
                  <Progress value={(account.seat_count / account.seat_limit) * 100} className="h-2" />
                ) : null}
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

        {/* HubSpot */}
        <TabsContent value="hubspot" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Données HubSpot</CardTitle></CardHeader>
            <CardContent>
              {!account.hubspot_data ? (
                <p className="text-muted-foreground">{fr.accountDetail.noData}</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground">NPS Score</p>
                    <p className="text-2xl font-bold">{account.hubspot_data.nps_score ?? '-'}</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground">Tickets ouverts</p>
                    <p className="text-2xl font-bold">{account.hubspot_data.open_ticket_count}</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground">Deals ouverts</p>
                    <p className="text-2xl font-bold">{account.hubspot_data.open_deal_count}</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground">Dernière réunion</p>
                    <p className="text-sm font-medium">
                      {account.hubspot_data.last_meeting_date
                        ? fr.format.date(account.hubspot_data.last_meeting_date)
                        : '-'}
                    </p>
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
