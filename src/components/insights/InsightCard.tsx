import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useT } from '@/lib/i18n/useT';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle, TrendingUp, Calendar, CreditCard, TrendingDown,
  CheckCircle2, X, ExternalLink, ChevronDown, ChevronUp, HeartPulse,
} from 'lucide-react';
import type { Insight, InsightType, InsightPriority, InsightStatus } from '@/types/insights';

// ─── Relative time formatter ────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 172800) return 'yesterday';
  return `${Math.floor(diffSec / 86400)}d ago`;
}

// ─── Component ──────────────────────────────────────────────────────────────

interface InsightCardProps {
  insight: Insight;
  onAcknowledge: (id: string) => void;
  onDismiss: (id: string) => void;
  isUpdating: boolean;
}

export default function InsightCard({ insight, onAcknowledge, onDismiss, isUpdating }: InsightCardProps) {
  const fr = useT();
  const { user } = useAuth();
  const currency = user?.currency ?? 'usd';
  const PRIORITY_CONFIG: Record<InsightPriority, { label: string; className: string }> = {
    critical: { label: fr.insights.priority.critical, className: 'bg-red-100 text-red-800' },
    high: { label: fr.insights.priority.high, className: 'bg-orange-100 text-orange-800' },
    medium: { label: fr.insights.priority.medium, className: 'bg-yellow-100 text-yellow-800' },
    low: { label: fr.insights.priority.low, className: 'bg-gray-100 text-gray-600' },
  };
  // Partial, not Record<InsightType, ...>: insight_type comes from the
  // network, and InsightType is a lie the moment the backend ships a value
  // this union doesn't know about yet (see account_health_summary, added
  // 2026-06-14 backend-side and only wired up here 2026-08-05 — the gap
  // crashed this card on every render in the meantime). Partial forces the
  // lookup below to go through the unknown-type fallback instead of a
  // false compile-time guarantee.
  const TYPE_CONFIG: Partial<Record<InsightType, { label: string; icon: typeof AlertTriangle; className: string }>> = {
    churn_prediction: { label: fr.insights.churnPrediction, icon: AlertTriangle, className: 'text-red-600' },
    expansion_opportunity: { label: fr.insights.expansionOpportunity, icon: TrendingUp, className: 'text-green-600' },
    renewal_alert: { label: fr.insights.renewalAlert, icon: Calendar, className: 'text-orange-600' },
    payment_risk: { label: fr.insights.paymentRisk, icon: CreditCard, className: 'text-red-600' },
    usage_drop: { label: fr.insights.usageDecline, icon: TrendingDown, className: 'text-yellow-600' },
    account_health_summary: { label: fr.insights.accountHealthSummary, icon: HeartPulse, className: 'text-blue-600' },
  };
  const UNKNOWN_TYPE_CONFIG = { label: fr.insights.unknownType, icon: AlertTriangle, className: 'text-muted-foreground' };
  const STATUS_CONFIG: Record<InsightStatus, { label: string; className: string }> = {
    active: { label: fr.insights.status.active, className: 'bg-blue-100 text-blue-800' },
    acknowledged: { label: fr.insights.status.acknowledged, className: 'bg-purple-100 text-purple-800' },
    resolved: { label: fr.insights.status.resolved, className: 'bg-green-100 text-green-800' },
    dismissed: { label: fr.insights.status.dismissed, className: 'bg-gray-100 text-gray-500' },
  };
  const [expanded, setExpanded] = useState(false);
  const [showNewBadge, setShowNewBadge] = useState(insight.is_new === true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!insight.is_new) return;
    timerRef.current = setTimeout(() => setShowNewBadge(false), 5000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [insight.is_new]);

  const priority = PRIORITY_CONFIG[insight.priority];
  const type = TYPE_CONFIG[insight.insight_type] ?? UNKNOWN_TYPE_CONFIG;
  const statusCfg = STATUS_CONFIG[insight.status];
  const TypeIcon = type.icon;

  const isTerminal = insight.status === 'resolved' || insight.status === 'dismissed';
  const canAcknowledge = insight.status === 'active';
  const canDismiss = insight.status === 'active' || insight.status === 'acknowledged';

  const borderClass = insight.priority === 'critical'
    ? 'border-l-4 border-l-red-500'
    : insight.priority === 'high'
      ? 'border-l-4 border-l-orange-400'
      : '';

  const animationClass = insight.is_new ? 'animate-slide-in-right' : '';

  return (
    <Card className={`relative ${borderClass} ${isTerminal ? 'opacity-60' : ''} ${animationClass}`}>
      {/* New badge */}
      {showNewBadge && (
        <span className="absolute right-3 top-3 inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground z-10 animate-scale-in">
          {fr.badge.new}
        </span>
      )}

      <CardContent className="p-4 min-h-[140px]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Badges row */}
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${priority.className}`}>
                {priority.label}
              </span>
              <span className={`inline-flex items-center gap-1 text-xs font-medium ${type.className}`}>
                <TypeIcon className="h-3.5 w-3.5" />
                {type.label}
              </span>
              {insight.status !== 'active' && (
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusCfg.className}`}>
                  {statusCfg.label}
                </span>
              )}
            </div>

            {/* Title + description */}
            <p className="font-semibold text-sm line-clamp-1">{insight.title}</p>
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{insight.description}</p>

            {/* Metrics row */}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
              {insight.mrr_impact_cents != null && (
                <span className="font-medium text-foreground">
                  MRR : {fr.format.currency(insight.mrr_impact_cents, currency)}
                </span>
              )}
              {insight.confidence_score != null && (
                <span>{fr.insights.confidence} : {Math.round(insight.confidence_score)}%</span>
              )}
              <span>{relativeTime(insight.created_at)}</span>
              {insight.account_id && (
                <Link
                  to={`/accounts/${insight.account_id}`}
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  {fr.insights.viewAccount}
                </Link>
              )}
            </div>

            {/* Recommended action (collapsible) */}
            {insight.recommended_action && (
              <div className="mt-2">
                <button
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {fr.insights.recommendedAction}
                </button>
                {expanded && (
                  <p className="mt-1 text-sm text-muted-foreground bg-muted/50 rounded-md p-2">
                    {insight.recommended_action}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          {!isTerminal && (
            <div className="flex items-center gap-1.5 shrink-0">
              {canAcknowledge && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs gap-1"
                  onClick={() => onAcknowledge(insight.id)}
                  disabled={isUpdating}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {fr.insights.acknowledge}
                </Button>
              )}
              {canDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs gap-1 text-muted-foreground hover:text-destructive"
                  onClick={() => onDismiss(insight.id)}
                  disabled={isUpdating}
                >
                  <X className="h-3.5 w-3.5" />
                  {fr.insights.dismiss}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
