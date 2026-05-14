import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useSegments } from '@/hooks/useSegments';
import { useT } from '@/lib/i18n/useT';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import ScoreBadge from '@/components/ScoreBadge';

export default function Segments() {
  const fr = useT();
  const { data: segments, isLoading, error } = useSegments();

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">{fr.segments.title}</h1>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : error ? (
        <p className="text-destructive">{fr.common.error}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(segments || []).map(segment => (
            <Link key={segment.name} to={`/segments/${segment.name}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{segment.label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{segment.count}</span>
                    <span className="text-sm text-muted-foreground">{fr.segmentDetail.accountCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">MRR</span>
                    <span className="font-medium">{fr.format.currency(segment.mrr_cents)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{fr.scores.healthScore}</span>
                    <ScoreBadge score={segment.avg_health_score} />
                  </div>
                  <div className="flex justify-end pt-1">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
