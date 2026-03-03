import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { fr } from '@/i18n/fr';
import type { AiInsight, InsightType, InsightSeverity } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCheck, X, BrainCircuit, ExternalLink } from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

function severityBadgeVariant(s: InsightSeverity) {
  switch (s) {
    case 'critical': return 'destructive';
    case 'high': return 'destructive';
    case 'medium': return 'secondary';
    default: return 'outline';
  }
}

function severityLabel(s: InsightSeverity) {
  return fr.insights.severity[s];
}

function insightTypeLabel(t: InsightType) {
  switch (t) {
    case 'churn_risk': return fr.insights.churnPrediction;
    case 'expansion': return fr.insights.expansionOpportunity;
    case 'reactivation': return 'Réactivation';
    case 'health_drop': return fr.insights.usageDecline;
    case 'milestone': return 'Jalons';
  }
}

// ─── Fetcher ────────────────────────────────────────────────────────────────

async function fetchInsights(
  orgId: string,
  filterType: string,
  filterSeverity: string,
): Promise<AiInsight[]> {
  let query = supabase
    .from('ai_insights')
    .select('*')
    .eq('organization_id', orgId)
    .eq('is_dismissed', false)
    .order('is_read', { ascending: true })
    .order('generated_at', { ascending: false })
    .limit(100);

  if (filterType !== 'all') query = query.eq('insight_type', filterType);
  if (filterSeverity !== 'all') query = query.eq('severity', filterSeverity);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function Insights() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const { data: insights, isLoading, error } = useQuery({
    queryKey: ['insights', user?.organization_id, filterType, filterSeverity],
    queryFn: () => fetchInsights(user?.organization_id ?? '', filterType, filterSeverity),
    enabled: !!user?.organization_id,
    staleTime: 60_000,
  });

  const insightsQueryKey = ['insights', user?.organization_id, filterType, filterSeverity];

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ai_insights').update({ is_read: true }).eq('id', id);
      if (error) throw error;
    },
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: insightsQueryKey });
      const previous = qc.getQueryData<AiInsight[]>(insightsQueryKey);
      qc.setQueryData<AiInsight[]>(insightsQueryKey, (old) =>
        old?.map(i => i.id === id ? { ...i, is_read: true } : i),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) qc.setQueryData(insightsQueryKey, context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: insightsQueryKey }),
  });

  const dismiss = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ai_insights').update({ is_dismissed: true }).eq('id', id);
      if (error) throw error;
    },
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: insightsQueryKey });
      const previous = qc.getQueryData<AiInsight[]>(insightsQueryKey);
      qc.setQueryData<AiInsight[]>(insightsQueryKey, (old) =>
        old?.filter(i => i.id !== id),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) qc.setQueryData(insightsQueryKey, context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: insightsQueryKey }),
  });

  const unreadCount = (insights || []).filter(i => !i.is_read).length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{fr.insights.title}</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
            </p>
          )}
        </div>
        <BrainCircuit className="h-7 w-7 text-primary/60" />
      </div>

      {/* Filtres */}
      <div className="flex gap-3 flex-wrap">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Type d'insight" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="churn_risk">{fr.insights.churnPrediction}</SelectItem>
            <SelectItem value="expansion">{fr.insights.expansionOpportunity}</SelectItem>
            <SelectItem value="reactivation">Réactivation</SelectItem>
            <SelectItem value="health_drop">{fr.insights.usageDecline}</SelectItem>
            <SelectItem value="milestone">Jalons</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sévérité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="critical">{fr.insights.severity.critical}</SelectItem>
            <SelectItem value="high">{fr.insights.severity.high}</SelectItem>
            <SelectItem value="medium">{fr.insights.severity.medium}</SelectItem>
            <SelectItem value="low">{fr.insights.severity.low}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : error ? (
        <Card className="border-destructive">
          <CardContent className="p-6">
            <p className="text-destructive">{fr.common.error}</p>
          </CardContent>
        </Card>
      ) : !insights || insights.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BrainCircuit className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">{fr.common.noResults}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {insights.map(insight => (
            <Card
              key={insight.id}
              className={insight.is_read ? 'opacity-70' : 'border-primary/30 bg-primary/5'}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge variant={severityBadgeVariant(insight.severity)}>
                        {severityLabel(insight.severity)}
                      </Badge>
                      <Badge variant="outline">{insightTypeLabel(insight.insight_type)}</Badge>
                      {!insight.is_read && (
                        <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>

                    <p className="font-semibold text-sm">{insight.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{insight.content}</p>

                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{fr.format.dateTime(insight.generated_at)}</span>
                      <Link
                        to={`/accounts/${insight.account_id}`}
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Voir le compte
                      </Link>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!insight.is_read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label={fr.insights.markAsRead}
                        onClick={() => markRead.mutate(insight.id)}
                        disabled={markRead.isPending}
                      >
                        <CheckCheck className="h-4 w-4 text-success" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Ignorer"
                      onClick={() => dismiss.mutate(insight.id)}
                      disabled={dismiss.isPending}
                    >
                      <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
