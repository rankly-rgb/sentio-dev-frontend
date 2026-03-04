import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { fr } from '@/i18n/fr';
import type { InsightStats } from '@/types/insights';
import { AlertTriangle, TrendingUp, BrainCircuit, DollarSign } from 'lucide-react';

interface InsightStatsCardsProps {
  stats: InsightStats | undefined;
  isLoading: boolean;
}

export default function InsightStatsCards({ stats, isLoading }: InsightStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: fr.insights.stats.totalActive,
      value: stats?.by_status?.active ?? 0,
      icon: BrainCircuit,
      className: 'text-primary',
    },
    {
      label: fr.insights.stats.critical,
      value: stats?.by_priority?.critical ?? 0,
      icon: AlertTriangle,
      className: 'text-red-600',
    },
    {
      label: fr.insights.stats.mrrAtRisk,
      value: stats ? fr.format.currency(stats.total_mrr_impact_cents) : '0 €',
      icon: DollarSign,
      className: 'text-orange-600',
      raw: true,
    },
    {
      label: fr.insights.stats.expansion,
      value: stats?.by_type?.expansion_opportunity ?? 0,
      icon: TrendingUp,
      className: 'text-green-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(({ label, value, icon: Icon, className, raw }) => (
        <Card key={label}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">{label}</p>
              <Icon className={`h-4 w-4 ${className}`} />
            </div>
            <p className={`text-2xl font-bold ${className}`}>
              {raw ? value : String(value)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
