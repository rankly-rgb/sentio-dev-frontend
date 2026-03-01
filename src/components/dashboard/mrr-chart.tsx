import { useQuery } from '@tanstack/react-query';
import { getMrrTrend } from '@/lib/queries/mrr';
import { fr } from '@/i18n/fr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function MrrChart() {
  const { data: trend, isLoading } = useQuery({
    queryKey: ['mrr', 'trend'],
    queryFn: () => getMrrTrend(12),
    staleTime: 300_000,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{fr.mrr.trend}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : !trend || trend.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            Aucune donnée MRR disponible
          </div>
        ) : (
          <div className="h-48 flex items-end gap-1">
            {/* Barres simples — remplacer par Recharts quand les données sont prêtes */}
            {trend.map(point => {
              const maxMrr = Math.max(...trend.map(t => t.mrr_cents), 1);
              const height = (point.mrr_cents / maxMrr) * 100;
              return (
                <div key={point.date} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-primary rounded-t transition-all"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-[10px] text-muted-foreground">{point.date.slice(5)}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
