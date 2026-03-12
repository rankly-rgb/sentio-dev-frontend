import { fr } from '@/i18n/fr';
import ScoreBadge from '@/components/ScoreBadge';
import { relativeTimeFr } from '@/lib/account-detail-helpers';
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

function ScoreBar({ label, score }: { label: string; score: number | null }) {
  const isNull = score === null || score === undefined;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {isNull ? (
            <span className="text-muted-foreground">{fr.accountDetail.scoreNotCalculated}</span>
          ) : (
            `${Math.round(score)}/100`
          )}
        </span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        {!isNull && (
          <div
            className={`h-full transition-all ${scoreProgressColor(score)}`}
            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          />
        )}
      </div>
    </div>
  );
}

export default function AccountScoreCard({ account, trackerConnected }: Props) {
  const healthScore = account.health_score;

  return (
    <div className="space-y-4">
      {/* Health score circle */}
      <div className="flex items-center gap-4">
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-full border-4 font-bold text-xl shrink-0 ${
            healthScore !== null
              ? healthScoreColor(healthScore)
              : 'text-muted-foreground border-gray-200'
          }`}
        >
          {healthScore !== null ? Math.round(healthScore) : '—'}
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
        <ScoreBar label={fr.scores.financialHealth} score={account.financial_score} />
        <ScoreBar label={fr.scores.engagementScore} score={account.engagement_score} />
        <ScoreBar label={fr.scores.contractScore} score={account.contract_score} />
        {trackerConnected ? (
          <ScoreBar label={fr.scores.productUsage} score={account.product_usage_score} />
        ) : (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{fr.scores.productUsage}</span>
              <span className="text-muted-foreground text-[10px]">Tracker non connecté</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-secondary border border-dashed border-gray-300" />
          </div>
        )}
      </div>
    </div>
  );
}
