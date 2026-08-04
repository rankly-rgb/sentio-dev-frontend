import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMrrMovementSummary, calculateNrr } from '@/lib/queries/mrr';
import { useT } from '@/lib/i18n/useT';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function formatMonth(offset: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return d.toISOString().split('T')[0];
}

export default function MrrDashboard() {
  const fr = useT();
  const { user } = useAuth();
  const currency = user?.currency ?? 'usd';
  const [period] = useState({ from: formatMonth(-1), to: formatMonth(0) });

  const summaryQuery = useQuery({
    queryKey: ['mrr', 'summary', period],
    queryFn: () => getMrrMovementSummary(period),
    staleTime: 120_000,
  });

  const nrrQuery = useQuery({
    queryKey: ['mrr', 'nrr', period],
    queryFn: () => calculateNrr(period),
    staleTime: 120_000,
  });

  const summary = summaryQuery.data;
  const nrr = nrrQuery.data;
  const isLoading = summaryQuery.isLoading || nrrQuery.isLoading;

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">{fr.mrr.title}</h1>

      {/* NRR en grand */}
      <Card className={nrr && nrr >= 100 ? 'border-success' : 'border-warning'}>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">{fr.dashboard.nrr}</p>
          <p className="text-4xl font-bold">{nrr ? fr.format.percentage(nrr) : '-'}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {nrr && nrr >= 100 ? '> 100% = excellent' : '< 100% = attention requise'}
          </p>
        </CardContent>
      </Card>

      {/* Mouvements MRR */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: fr.mrr.new, value: summary.new_cents, color: 'text-success' },
            { label: fr.mrr.expansion, value: summary.expansion_cents, color: 'text-success' },
            { label: fr.mrr.reactivation, value: summary.reactivation_cents, color: 'text-success' },
            { label: fr.mrr.contraction, value: -summary.contraction_cents, color: 'text-destructive' },
            { label: fr.mrr.churn, value: -summary.churn_cents, color: 'text-destructive' },
            { label: fr.mrr.net, value: summary.net_cents, color: summary.net_cents >= 0 ? 'text-success' : 'text-destructive' },
          ].map(item => (
            <Card key={item.label}>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className={`text-lg font-bold ${item.color}`}>
                  {fr.format.currency(Math.abs(item.value), currency)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* TODO: Graphique tendance MRR avec recharts */}
      <Card>
        <CardHeader><CardTitle>{fr.mrr.trend}</CardTitle></CardHeader>
        <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
          Graphique tendance MRR (recharts)
        </CardContent>
      </Card>
    </div>
  );
}
