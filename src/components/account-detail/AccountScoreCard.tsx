import { Link } from 'react-router-dom';
import { useT } from '@/lib/i18n/useT';
import ScoreBadge from '@/components/ScoreBadge';
import { relativeTimeFr } from '@/lib/account-detail-helpers';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, ChevronDown, Settings } from 'lucide-react';
import ScoreConfetti from '@/components/ScoreConfetti';
import type { AccountDetail, ScoreDimensionKey, ScoreBreakdownDimension } from '@/lib/types/accounts';
import {
  HEALTH_BAND_STYLE,
  HEALTH_BAND_RING_STYLE,
  churnBandStyle,
  RISK_SEVERITY_STYLE,
  TREND_ARROW,
  healthScoreTrendColor,
  EXPANSION_UNAVAILABLE_REASON_LABEL,
  roundScore,
} from '@/lib/scoring-display';

interface Props {
  account: AccountDetail;
}

const DIMENSION_ORDER: ScoreDimensionKey[] = ['payment_health', 'revenue_dynamics', 'contract_renewal'];

function dimensionColor(score: number): string {
  if (score >= 70) return 'bg-green-500';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}

function DimensionBar({
  label,
  tooltip,
  dimension,
}: {
  label: string;
  tooltip: string;
  dimension: ScoreBreakdownDimension | undefined;
}) {
  const fr = useT();

  if (!dimension || dimension.status === 'unavailable' || dimension.score === null) {
    const missingSignals = (dimension?.signals ?? []).filter((s) => s.status === 'unavailable');
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground flex items-center gap-1">
            {label}
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[220px] text-xs">{tooltip}</TooltipContent>
            </Tooltip>
          </span>
          <span className="text-muted-foreground text-[10px]">{fr.scores.dimensionUnavailableSoon}</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-secondary border border-dashed border-gray-300" />
        {missingSignals.length > 0 && (
          <p className="text-[11px] text-muted-foreground/70 leading-snug">
            {fr.scores.dimensionUnavailableHistory} — {missingSignals.map((s) => s.label).join(', ')}
          </p>
        )}
      </div>
    );
  }

  const score = dimension.score;

  return (
    <Collapsible>
      <div className="space-y-1">
        <div className="flex justify-between text-xs items-center">
          <span className="text-muted-foreground flex items-center gap-1">
            {label}
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[220px] text-xs">{tooltip}</TooltipContent>
            </Tooltip>
          </span>
          <CollapsibleTrigger className="flex items-center gap-1 font-medium hover:text-foreground group">
            {roundScore(score)}/100
            <ChevronDown className="h-3 w-3 text-muted-foreground/60 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
        </div>
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div className={`h-full ${dimensionColor(score)}`} style={{ width: `${Math.min(100, Math.max(0, score))}%` }} />
        </div>
        <CollapsibleContent className="space-y-1 pt-1">
          {dimension.signals.map((signal) => (
            <div key={signal.code} className="flex justify-between text-[11px] text-muted-foreground/80">
              <span>{signal.label}</span>
              <span className="font-mono">{signal.status === 'available' && signal.value !== null ? Math.round(signal.value) : '—'}</span>
            </div>
          ))}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function HealthScoreHeader({ account }: { account: AccountDetail }) {
  const fr = useT();
  const { health_score, health_score_status, health_score_band, health_score_max_points, trend_30d } = account;

  if (health_score_status === 'insufficient' || health_score === null) {
    const missingDims = DIMENSION_ORDER
      .map((key) => ({ key, dim: account.score_breakdown[key] }))
      .filter((d) => d.dim?.status === 'unavailable');
    return (
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium">{fr.scores.healthScore}</p>
        <p className="text-sm text-muted-foreground">{fr.scores.insufficientData} — {fr.scores.insufficientDataDetail}</p>
        {missingDims.length > 0 && (
          <p className="text-xs text-muted-foreground/70">
            {missingDims.map((d) => d.dim?.signals[0]?.label ?? d.key).join(', ')}
          </p>
        )}
      </div>
    );
  }

  const band = health_score_band ?? 'watch';
  const bandStyle = HEALTH_BAND_STYLE[band];

  return (
    <div className="flex-1 space-y-1">
      <p className="text-sm font-medium">{fr.scores.healthScore}</p>
      <div className="flex items-center gap-2">
        {health_score_status === 'partial' ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center gap-1.5 cursor-help">
                <span className="font-semibold">{roundScore(health_score)}/{health_score_max_points} pts</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-warning/40 text-warning">
                  {fr.scores.partialScoreBadge}
                </Badge>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[240px] text-xs">
              {fr.scores.partialScoreTooltip(
                DIMENSION_ORDER.filter((k) => account.score_breakdown[k]?.status === 'available').length,
                DIMENSION_ORDER.length,
                DIMENSION_ORDER.filter((k) => account.score_breakdown[k]?.status !== 'available')
                  .map((k) => k.replace('_', ' '))
                  .join(', '),
              )}
            </TooltipContent>
          </Tooltip>
        ) : (
          <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-sm font-semibold ${bandStyle.color}`}>
            {roundScore(health_score)} · {bandStyle.label}
          </span>
        )}
        <span className={`text-sm ${healthScoreTrendColor(trend_30d)}`} title={fr.scores.trendLabel}>
          {TREND_ARROW[trend_30d]}
        </span>
      </div>
      {account.scores_calculated_at && (
        <p className="text-xs text-muted-foreground">Updated {relativeTimeFr(account.scores_calculated_at)}</p>
      )}
    </div>
  );
}

function ChurnRiskSection({ account }: { account: AccountDetail }) {
  const fr = useT();
  const bandStyle = churnBandStyle(account.churn_risk_band);
  const signals = account.risk_signals_triggered;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{fr.scores.churnRisk}</span>
        <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold ${bandStyle.color}`}>
          {bandStyle.label}{account.churn_risk_score != null && ` · ${roundScore(account.churn_risk_score)}`}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground/70">{fr.scores.basedOnSignals(account.risk_signals_evaluated)}</p>
      {signals.length === 0 ? (
        <p className="text-[11px] text-muted-foreground/70">{fr.scores.noActiveRiskSignals}</p>
      ) : (
        <div className="space-y-1">
          {signals.map((signal) => {
            const severityStyle = RISK_SEVERITY_STYLE[signal.severity];
            return (
              <div key={signal.code} className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${severityStyle.color.split(' ')[0]}`} />
                  {signal.label}
                </span>
                <span className={`font-mono ${severityStyle.color}`}>+{signal.points}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ExpansionSection({ account }: { account: AccountDetail }) {
  const fr = useT();

  if (account.expansion_score_status === 'unavailable' || account.expansion_score === null) {
    const reason = account.expansion_unavailable_reason;
    const message = reason ? EXPANSION_UNAVAILABLE_REASON_LABEL[reason] : fr.scores.insufficientData;
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{fr.scores.expansionScore}</span>
          <span className="text-muted-foreground">—</span>
        </div>
        <p className="text-[11px] text-muted-foreground/70">{message}</p>
        {reason === 'seat_data_not_configured' && (
          <Link
            to="/settings?tab=plans-sieges"
            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
          >
            <Settings className="h-3 w-3" />
            {fr.scores.expansionUnlockCta}
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{fr.scores.expansionScore}</span>
      <ScoreBadge score={account.expansion_score} type="expansion" showLabel />
    </div>
  );
}

export default function AccountScoreCard({ account }: Props) {
  const fr = useT();

  return (
    <div className="space-y-4">
      {/* Health score header */}
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-full border-4 font-bold text-xl ${
              account.health_score !== null && account.health_score_band
                ? HEALTH_BAND_RING_STYLE[account.health_score_band]
                : 'text-muted-foreground border-gray-200'
            }`}
          >
            {account.health_score !== null ? roundScore(account.health_score) : '—'}
          </div>
          {account.health_score !== null && (
            <ScoreConfetti
              accountId={account.id}
              score={account.health_score}
              isNew={account.health_score_is_new ?? false}
            />
          )}
        </div>
        <HealthScoreHeader account={account} />
      </div>

      {/* Churn risk + expansion */}
      <div className="grid grid-cols-1 gap-3 rounded-md border p-3">
        <ChurnRiskSection account={account} />
        <div className="border-t pt-3">
          <ExpansionSection account={account} />
        </div>
      </div>

      {/* Live dimensions (score_breakdown) */}
      <div className="space-y-2.5">
        <DimensionBar
          label={fr.scores.paymentHealth}
          tooltip={fr.scores.paymentHealthTooltip}
          dimension={account.score_breakdown.payment_health}
        />
        <DimensionBar
          label={fr.scores.revenueDynamics}
          tooltip={fr.scores.revenueDynamicsTooltip}
          dimension={account.score_breakdown.revenue_dynamics}
        />
        <DimensionBar
          label={fr.scores.contractRenewal}
          tooltip={fr.scores.contractRenewalTooltip}
          dimension={account.score_breakdown.contract_renewal}
        />

        {/* Dimensions retirées du modèle v2 — cartes statiques, jamais de score/jauge (§F3) */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="rounded-md border border-dashed p-2 text-center">
            <p className="text-[11px] text-muted-foreground">{fr.scores.engagementScore}</p>
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">{fr.scores.comingWithHubspot}</p>
          </div>
          <div className="rounded-md border border-dashed p-2 text-center">
            <p className="text-[11px] text-muted-foreground">{fr.scores.productUsage}</p>
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">{fr.scores.comingWithUsageTracking}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
