import { useCallback, useState } from 'react';
import { useT } from '@/lib/i18n/useT';
import { useInsights, useUpdateInsightStatus, useScoreFeedback } from '@/hooks/useInsights';
import { Skeleton } from '@/components/ui/skeleton';
import { BrainCircuit, ThumbsUp, ThumbsDown } from 'lucide-react';
import type { InsightPriority, InsightType } from '@/types/insights';

interface Props {
  accountId: string;
}

export default function AccountInsights({ accountId }: Props) {
  const fr = useT();
  const PRIORITY_CONFIG: Record<InsightPriority, { label: string; className: string }> = {
    critical: { label: fr.insights.priority.critical, className: 'bg-red-100 text-red-800' },
    high: { label: fr.insights.priority.high, className: 'bg-orange-100 text-orange-800' },
    medium: { label: fr.insights.priority.medium, className: 'bg-yellow-100 text-yellow-800' },
    low: { label: fr.insights.priority.low, className: 'bg-gray-100 text-gray-600' },
  };
  const TYPE_LABELS: Record<InsightType, string> = {
    churn_prediction: fr.insights.churnPrediction,
    expansion_opportunity: fr.insights.expansionOpportunity,
    renewal_alert: fr.insights.renewalAlert,
    payment_risk: fr.insights.paymentRisk,
    usage_drop: fr.insights.usageDecline,
  };
  const { data, isLoading } = useInsights({
    account_id: accountId,
    per_page: 5,
    status: 'active',
  });
  const updateStatus = useUpdateInsightStatus();
  const scoreFeedback = useScoreFeedback();
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, boolean>>({});

  const handleAcknowledge = useCallback(
    (id: string) => updateStatus.mutate({ id, status: 'acknowledged' }),
    [updateStatus],
  );
  const handleDismiss = useCallback(
    (id: string) => updateStatus.mutate({ id, status: 'dismissed' }),
    [updateStatus],
  );
  const handleFeedback = useCallback(
    (insightId: string, isHelpful: boolean) => {
      scoreFeedback.mutate(
        { account_id: accountId, insight_id: insightId, is_helpful: isHelpful },
        { onSuccess: () => setFeedbackGiven((prev) => ({ ...prev, [insightId]: true })) },
      );
    },
    [accountId, scoreFeedback],
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  const insights = data?.data ?? [];

  if (insights.length === 0) {
    return (
      <div className="text-center py-4">
        <BrainCircuit className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
        <p className="text-xs text-muted-foreground">{fr.insights.noInsights}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {insights.map((insight) => {
        const priority = PRIORITY_CONFIG[insight.priority];
        const typeLabel = TYPE_LABELS[insight.insight_type] ?? insight.insight_type;
        const borderClass =
          insight.priority === 'critical'
            ? 'border-l-2 border-l-red-500'
            : insight.priority === 'high'
              ? 'border-l-2 border-l-orange-400'
              : '';

        return (
          <div
            key={insight.id}
            className={`rounded-lg border p-3 ${borderClass}`}
          >
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span
                    className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase ${priority.className}`}
                  >
                    {priority.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{typeLabel}</span>
                </div>
                <p className="text-sm font-medium">{insight.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                  {insight.description}
                </p>
                {insight.recommended_action && (
                  <p className="text-xs text-primary mt-1">{insight.recommended_action}</p>
                )}
                <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                  {insight.mrr_impact_cents != null && (
                    <span className="font-medium text-foreground">
                      MRR : {fr.format.currency(insight.mrr_impact_cents)}
                    </span>
                  )}
                  {insight.confidence_score != null && (
                    <span>{fr.insights.confidence} : {Math.round(insight.confidence_score)}%</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <button
                  className="text-[10px] text-primary hover:underline"
                  onClick={() => handleAcknowledge(insight.id)}
                  disabled={updateStatus.isPending}
                >
                  {fr.insights.acknowledge}
                </button>
                <button
                  className="text-[10px] text-muted-foreground hover:text-destructive"
                  onClick={() => handleDismiss(insight.id)}
                  disabled={updateStatus.isPending}
                >
                  {fr.insights.dismiss}
                </button>
                {feedbackGiven[insight.id] ? (
                  <span className="text-[10px] text-muted-foreground">{fr.insights.feedbackThanks}</span>
                ) : (
                  <div className="flex items-center gap-1" aria-label={fr.insights.feedbackHelpful}>
                    <button
                      className="text-muted-foreground hover:text-success disabled:opacity-50"
                      onClick={() => handleFeedback(insight.id, true)}
                      disabled={scoreFeedback.isPending}
                      aria-label={fr.insights.feedbackHelpful}
                    >
                      <ThumbsUp className="h-3 w-3" />
                    </button>
                    <button
                      className="text-muted-foreground hover:text-destructive disabled:opacity-50"
                      onClick={() => handleFeedback(insight.id, false)}
                      disabled={scoreFeedback.isPending}
                      aria-label={fr.insights.feedbackHelpful}
                    >
                      <ThumbsDown className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
