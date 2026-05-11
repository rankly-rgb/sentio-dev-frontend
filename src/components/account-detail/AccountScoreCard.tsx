import { useEffect, useRef, useState } from 'react';
import { useT } from '@/lib/i18n/useT';
import ScoreBadge from '@/components/ScoreBadge';
import { relativeTimeFr } from '@/lib/account-detail-helpers';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import ScoreConfetti from '@/components/ScoreConfetti';
import type { AccountDetail } from '@/lib/types/accounts';

interface Props {
  account: AccountDetail;
  trackerConnected: boolean;
}

function scoreProgressColor(value: number): string {
  if (value >= 70) return 'bg-green-500';
  if (value >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}

function healthScoreColor(score: number): string {
  if (score >= 70) return 'text-green-600 border-green-200';
  if (score >= 40) return 'text-yellow-600 border-yellow-200';
  return 'text-red-600 border-red-200';
}

interface ScoreBarProps {
  label: string;
  score: number | null;
  tooltip?: string;
  narrative?: string | null;
  animate?: boolean;
}

function ScoreBar({ label, score, tooltip, narrative, animate = true }: ScoreBarProps) {
  const fr = useT();
  const isNull = score === null || score === undefined;
  const [displayWidth, setDisplayWidth] = useState(0);
  const animatedRef = useRef(false);

  useEffect(() => {
    if (!animate || isNull || animatedRef.current) return;
    animatedRef.current = true;
    // Start from 0, then animate to target
    const target = Math.min(100, Math.max(0, score as number));
    const raf = requestAnimationFrame(() => {
      setTimeout(() => setDisplayWidth(target), 50);
    });
    return () => cancelAnimationFrame(raf);
  }, [animate, isNull, score]);

  // Without animation: set immediately
  useEffect(() => {
    if (!animate && !isNull) {
      setDisplayWidth(Math.min(100, Math.max(0, score as number)));
    }
  }, [animate, isNull, score]);

  const barContent = (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground flex items-center gap-1">
          {label}
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[220px] text-xs">
                {tooltip}
              </TooltipContent>
            </Tooltip>
          )}
        </span>
        <span className="font-medium">
          {isNull ? (
            <span className="text-muted-foreground">{fr.accountDetail.scoreNotCalculated}</span>
          ) : (
            `${Math.round(score as number)}/100`
          )}
        </span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        {!isNull && (
          <div
            className={`h-full ${scoreProgressColor(score as number)}`}
            style={{
              width: `${displayWidth}%`,
              transition: animate ? 'width 600ms ease-out' : 'none',
            }}
          />
        )}
      </div>
      {narrative && (
        <p className="text-[11px] text-muted-foreground/70 leading-snug">{narrative}</p>
      )}
    </div>
  );

  // On desktop: narrative in tooltip; always visible on mobile via conditional below
  if (narrative) {
    return (
      <>
        {/* Desktop: tooltip on hover */}
        <div className="hidden sm:block">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-default">{barContent}</div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[260px] text-xs">
              {narrative}
            </TooltipContent>
          </Tooltip>
        </div>
        {/* Mobile: always visible */}
        <div className="sm:hidden">{barContent}</div>
      </>
    );
  }

  return barContent;
}

export default function AccountScoreCard({ account, trackerConnected }: Props) {
  const fr = useT();
  const healthScore = account.health_score;

  return (
    <div className="space-y-4">
      {/* Health score circle */}
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-full border-4 font-bold text-xl ${
              healthScore !== null
                ? healthScoreColor(healthScore)
                : 'text-muted-foreground border-gray-200'
            }`}
          >
            {healthScore !== null ? Math.round(healthScore) : '—'}
          </div>
          {healthScore !== null && (
            <ScoreConfetti
              accountId={account.id}
              score={healthScore}
              isNew={account.health_score_is_new ?? false}
            />
          )}
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium">{fr.scores.healthScore}</p>
          {account.scores_calculated_at && (
            <p className="text-xs text-muted-foreground">
              Mis à jour {relativeTimeFr(account.scores_calculated_at)}
            </p>
          )}
          <div className="flex gap-2 mt-1">
            <ScoreBadge score={account.churn_risk_score} type="churn" showLabel />
            <ScoreBadge score={account.expansion_score} type="expansion" showLabel />
          </div>
        </div>
      </div>

      {/* Sub-scores */}
      <div className="space-y-2.5">
        <ScoreBar
          label={fr.scores.financialHealth}
          score={account.financial_score}
          tooltip={fr.scores.financialHealthTooltip}
          narrative={account.financial_score_narrative}
        />
        <ScoreBar
          label={fr.scores.engagementScore}
          score={account.engagement_score}
          tooltip={fr.scores.engagementScoreTooltip}
          narrative={account.engagement_score_narrative}
        />
        <ScoreBar
          label={fr.scores.contractScore}
          score={account.contract_score}
          tooltip={fr.scores.contractScoreTooltip}
          narrative={account.contract_score_narrative}
        />
        {trackerConnected ? (
          <ScoreBar
            label={fr.scores.productUsage}
            score={account.product_usage_score}
            tooltip={fr.scores.productUsageTooltip}
            narrative={account.product_usage_score_narrative}
          />
        ) : (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                {fr.scores.productUsage}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px] text-xs">
                    {fr.scores.productUsageTooltip}
                  </TooltipContent>
                </Tooltip>
              </span>
              <span className="text-muted-foreground text-[10px]">Tracker non connecté</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-secondary border border-dashed border-gray-300" />
          </div>
        )}
      </div>
    </div>
  );
}
