import { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useT } from '@/lib/i18n/useT';
import { useInsights, useInsightStats, useUpdateInsightStatus } from '@/hooks/useInsights';
import InsightStatsCards from '@/components/insights/InsightStatsCards';
import InsightFilters from '@/components/insights/InsightFilters';
import InsightCard from '@/components/insights/InsightCard';
import InsightsPagination from '@/components/insights/InsightsPagination';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BrainCircuit } from 'lucide-react';
import type { InsightsFilters as FiltersType } from '@/types/insights';

type SortOption = 'created_at' | 'priority' | 'confidence_score' | 'mrr_impact_cents';

export default function Insights() {
  const fr = useT();
  const [searchParams] = useSearchParams();
  const priorityFromUrl = searchParams.get('priority') ?? '';
  const [insightType, setInsightType] = useState('');
  const [status, setStatus] = useState('active');
  const [sort, setSort] = useState<SortOption>('mrr_impact_cents');
  const [page, setPage] = useState(1);
  const [showAll, setShowAll] = useState(false);

  const DEFAULT_VISIBLE = 5;

  const filters: FiltersType = {
    ...(insightType ? { insight_type: insightType } : {}),
    ...(priorityFromUrl ? { priority: priorityFromUrl } : {}),
    status,
    sort,
    page,
    per_page: showAll ? 20 : DEFAULT_VISIBLE,
  };

  const { data: listData, isLoading, error, refetch } = useInsights(filters);
  const { data: statsData, isLoading: statsLoading } = useInsightStats();
  const updateStatus = useUpdateInsightStatus();

  const lastSeenAt = useMemo(() => sessionStorage.getItem('sentio_last_seen_at'), []);

  const handleTypeChange = useCallback((type: string) => {
    setInsightType(type);
    setPage(1);
    setShowAll(false);
  }, []);

  const handleStatusChange = useCallback((s: string) => {
    setStatus(s);
    setPage(1);
    setShowAll(false);
  }, []);

  const handleSortChange = useCallback((s: SortOption) => {
    setSort(s);
    setPage(1);
    setShowAll(false);
  }, []);

  const handleShowAll = useCallback(() => {
    setShowAll(true);
    setPage(1);
  }, []);

  const handleAcknowledge = useCallback((id: string) => {
    updateStatus.mutate({ id, status: 'acknowledged' });
  }, [updateStatus]);

  const handleDismiss = useCallback((id: string) => {
    updateStatus.mutate({ id, status: 'dismissed' });
  }, [updateStatus]);

  const insights = useMemo(() => {
    const raw = listData?.data ?? [];
    const seen = new Set<string>();
    const deduped = raw.filter(i => {
      const key = `${i.account_id}|${i.insight_type}|${i.created_at.slice(0, 10)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    if (import.meta.env.DEV && deduped.length < raw.length) {
      console.warn(`[sentio] insights: ${raw.length - deduped.length} duplicate(s) detected (account_id+insight_type+date)`);
    }
    return deduped;
  }, [listData]);
  const pagination = listData?.pagination;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{fr.insights.title}</h1>
        </div>
        <BrainCircuit className="h-7 w-7 text-primary/60" />
      </div>

      {/* Stats KPI cards */}
      <InsightStatsCards stats={statsData?.data} isLoading={statsLoading} />

      {/* Filters */}
      <InsightFilters
        insightType={insightType}
        onTypeChange={handleTypeChange}
        status={status}
        onStatusChange={handleStatusChange}
        sort={sort}
        onSortChange={handleSortChange}
      />

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : error ? (
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <p className="text-destructive mb-3">{fr.insights.errorLoading}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              {fr.common.retry}
            </Button>
          </CardContent>
        </Card>
      ) : insights.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BrainCircuit className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {insightType || status !== 'active'
                ? fr.insights.noFilterResults
                : fr.insights.noInsights}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {insights.map(insight => (
              <InsightCard
                key={insight.id}
                insight={{
                  ...insight,
                  is_new: lastSeenAt ? new Date(insight.created_at) > new Date(lastSeenAt) : false,
                }}
                onAcknowledge={handleAcknowledge}
                onDismiss={handleDismiss}
                isUpdating={updateStatus.isPending}
              />
            ))}
          </div>

          {!showAll && pagination && pagination.total > DEFAULT_VISIBLE ? (
            <div className="flex justify-center pt-2">
              <Button variant="outline" size="sm" onClick={handleShowAll}>
                {fr.insights.viewAll(pagination.total)}
              </Button>
            </div>
          ) : showAll && pagination ? (
            <InsightsPagination pagination={pagination} onPageChange={setPage} />
          ) : null}
        </>
      )}
    </div>
  );
}
