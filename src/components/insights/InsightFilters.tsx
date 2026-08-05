import { useT } from '@/lib/i18n/useT';
import { Button } from '@/components/ui/button';

type SortOption = 'created_at' | 'priority' | 'confidence_score' | 'mrr_impact_cents';

interface InsightFiltersProps {
  insightType: string;
  onTypeChange: (type: string) => void;
  status: string;
  onStatusChange: (status: string) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export default function InsightFilters({
  insightType,
  onTypeChange,
  status,
  onStatusChange,
  sort,
  onSortChange,
}: InsightFiltersProps) {
  const fr = useT();
  const TYPE_OPTIONS: Array<{ value: string; label: string }> = [
    { value: '', label: fr.common.all },
    { value: 'churn_prediction', label: fr.insights.churnPrediction },
    { value: 'expansion_opportunity', label: fr.insights.expansionOpportunity },
    { value: 'renewal_alert', label: fr.insights.renewalAlert },
    { value: 'payment_risk', label: fr.insights.paymentRisk },
    { value: 'usage_drop', label: fr.insights.usageDecline },
    { value: 'account_health_summary', label: fr.insights.accountHealthSummary },
  ];
  const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
    { value: 'active', label: fr.insights.status.active },
    { value: 'acknowledged', label: fr.insights.status.acknowledged },
    { value: 'resolved', label: fr.insights.status.resolved },
    { value: 'dismissed', label: fr.insights.status.dismissed },
  ];
  const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
    { value: 'created_at', label: fr.insights.sort.date },
    { value: 'priority', label: fr.insights.sort.priority },
    { value: 'confidence_score', label: fr.insights.sort.confidence },
    { value: 'mrr_impact_cents', label: fr.insights.sort.mrrImpact },
  ];
  return (
    <div className="space-y-3">
      {/* Type filter */}
      <div className="flex gap-1.5 flex-wrap">
        {TYPE_OPTIONS.map(({ value, label }) => (
          <Button
            key={value}
            variant={insightType === value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onTypeChange(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Status + Sort */}
      <div className="flex gap-4 flex-wrap items-center">
        <div className="flex gap-1.5 flex-wrap">
          <span className="text-xs text-muted-foreground self-center mr-1">{fr.insights.statusLabel} :</span>
          {STATUS_OPTIONS.map(({ value, label }) => (
            <Button
              key={value}
              variant={status === value ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => onStatusChange(value)}
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="flex gap-1.5 flex-wrap">
          <span className="text-xs text-muted-foreground self-center mr-1">{fr.insights.sortLabel} :</span>
          {SORT_OPTIONS.map(({ value, label }) => (
            <Button
              key={value}
              variant={sort === value ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => onSortChange(value)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
