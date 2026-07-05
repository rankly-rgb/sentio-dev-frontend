import { useNavigate } from 'react-router-dom';
import { getAccountLabel } from '@/lib/account-display';
import { Loader2 } from 'lucide-react';
import { useT } from '@/lib/i18n/useT';
import WizardLayout from '@/components/onboarding/WizardLayout';
import { useOnboardingStatusFull } from '@/hooks/useOnboardingWizard';
import { useOnboardingFirstWin, useMarkOnboardingField } from '@/hooks/useOnboardingFlow';
import { cn } from '@/lib/utils';
import type { WizardStep } from '@/lib/types/onboarding-wizard';

function healthBadgeClass(score: number) {
  if (score >= 70) return 'bg-green-500/20 text-green-400 border-green-500/30';
  if (score >= 40) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  return 'bg-red-500/20 text-red-400 border-red-500/30';
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(cents / 100);
}

export default function OnboardingFirstWin() {
  const t = useT();
  const w = t.onboardingWizard.firstWin;
  const navigate = useNavigate();

  const { data: statusData } = useOnboardingStatusFull();
  const { data: firstWin, isLoading } = useOnboardingFirstWin();
  const markField = useMarkOnboardingField();

  const steps: WizardStep[] = statusData?.data.wizard_steps ?? [];
  const accounts = firstWin?.at_risk_accounts?.slice(0, 3) ?? [];
  const mrrAtRisk = firstWin?.mrr_at_risk ?? 0;
  const globalScore = firstWin?.global_health_score ?? 0;

  const handleCta = async () => {
    await markField.mutateAsync('first_win_seen');
    navigate('/onboarding/hubspot', { replace: true });
  };

  return (
    <WizardLayout steps={steps}>
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-[#f8fafc]">{w.radarTitle}</h2>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#0f172a] rounded-xl p-4 border border-[#334155] text-center">
            <p className="text-xl font-bold text-red-400">{formatCurrency(mrrAtRisk)}</p>
            <p className="text-xs text-[#64748b] mt-1">{w.mrrAtRiskLabel}</p>
          </div>
          <div className="bg-[#0f172a] rounded-xl p-4 border border-[#334155] text-center">
            <p className={cn('text-xl font-bold', globalScore >= 70 ? 'text-green-400' : globalScore >= 40 ? 'text-amber-400' : 'text-red-400')}>
              {globalScore}
            </p>
            <p className="text-xs text-[#64748b] mt-1">{w.globalScoreLabel}</p>
          </div>
        </div>

        {/* Top at-risk accounts */}
        <div>
          <p className="text-xs font-medium text-[#64748b] uppercase tracking-wide mb-3">{w.topRiskTitle}</p>

          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
            </div>
          ) : accounts.length === 0 ? (
            <p className="text-sm text-center text-[#64748b] py-4">{w.noAccounts}</p>
          ) : (
            <ul className="space-y-2">
              {accounts.map((acc) => (
                <li
                  key={acc.stripe_customer_id}
                  className="flex items-center justify-between gap-3 bg-[#0f172a] rounded-xl border border-[#334155] px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#f8fafc] truncate">
                      {getAccountLabel(acc)}
                    </p>
                    {acc.top_risk_reason && (
                      <p className="text-xs text-[#64748b] truncate mt-0.5">{acc.top_risk_reason}</p>
                    )}
                  </div>
                  <span className={cn(
                    'flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border',
                    healthBadgeClass(acc.health_score),
                  )}>
                    {acc.health_score}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-[#475569] mt-3">{w.demoNote}</p>
        </div>

        <button
          type="button"
          onClick={handleCta}
          disabled={markField.isPending}
          className="w-full rounded-lg py-3 text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {markField.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {w.ctaFull}
        </button>
      </div>
    </WizardLayout>
  );
}
