import { useParams, useNavigate } from 'react-router-dom';
import { useAccountDetail } from '@/hooks/useAccountDetail';
import { fr } from '@/i18n/fr';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import ScoreBadge from '@/components/ScoreBadge';
import { ArrowLeft } from 'lucide-react';

export default function AccountDetail() {
  const { accountId } = useParams();
  const navigate = useNavigate();
  const { data: account, isLoading, error } = useAccountDetail(accountId);

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

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/accounts')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-mono">{account.stripe_customer_id}</h1>
          <div className="flex gap-2 mt-1">
            {account.plan_tier && <Badge>{account.plan_tier}</Badge>}
            {account.billing_interval && <Badge variant="outline">{account.billing_interval === 'monthly' ? fr.accounts.monthly : fr.accounts.annual}</Badge>}
          </div>
        </div>
      </div>

      {/* Scores */}
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

      {/* Onglets */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">{fr.accountDetail.overview}</TabsTrigger>
          <TabsTrigger value="subscriptions">{fr.accountDetail.subscriptions}</TabsTrigger>
          <TabsTrigger value="invoices">{fr.accountDetail.invoices}</TabsTrigger>
          <TabsTrigger value="usage">{fr.accountDetail.usage}</TabsTrigger>
          <TabsTrigger value="history">{fr.accountDetail.scoreHistory}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>{fr.accountDetail.contractPeriod}</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>Début : {account.contract_start_date ? fr.format.date(account.contract_start_date) : '-'}</p>
                <p>Fin : {account.contract_end_date ? fr.format.date(account.contract_end_date) : '-'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>{fr.accountDetail.seatUsage}</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>{account.seat_count ?? 0} / {account.seat_limit ?? '∞'} {fr.accounts.seats.toLowerCase()}</p>
                {account.seat_count && account.seat_limit && (
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2"
                      style={{ width: `${Math.min((account.seat_count / account.seat_limit) * 100, 100)}%` }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

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
                        <Badge variant={sub.status === 'active' ? 'default' : 'destructive'}>{sub.status}</Badge>
                      </div>
                      <p className="font-medium">{fr.format.currency(sub.mrr_cents)}/mois</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

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
                        <Badge variant={inv.status === 'paid' ? 'default' : 'destructive'}>{inv.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="mt-4">
          <Card>
            <CardContent className="p-4">
              {account.recent_usage.length === 0 ? (
                <p className="text-muted-foreground">{fr.accountDetail.noData}</p>
              ) : (
                <div className="space-y-2">
                  {account.recent_usage.map((event, i) => (
                    <div key={i} className="flex items-center justify-between p-2 text-sm">
                      <div>
                        <span className="font-medium">{event.event_type}</span>
                        {event.feature_name && <span className="text-muted-foreground ml-2">({event.feature_name})</span>}
                      </div>
                      <div className="text-right">
                        <span className="font-medium">{event.event_count}x</span>
                        <span className="text-muted-foreground ml-2">{fr.format.date(event.event_date)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-muted-foreground">{fr.accountDetail.noData}</p>
              {/* TODO: Graphique recharts de l'historique des scores */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
