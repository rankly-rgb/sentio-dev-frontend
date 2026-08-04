import { useNavigate } from 'react-router-dom';
import { getAccountLabel } from '@/lib/account-display';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useT } from '@/lib/i18n/useT';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import OnboardingHeader from '@/components/onboarding/OnboardingHeader';
import { useOnboardingGuard, useUpdateOnboardingStep } from '@/hooks/useOnboardingV2';
import { useOnboardingFirstWin, useMarkOnboardingField } from '@/hooks/useOnboardingFlow';

export default function Revelation() {
  const fr = useT();
  const { user } = useAuth();
  const currency = user?.currency ?? 'usd';
  const navigate = useNavigate();
  const { isGuarding } = useOnboardingGuard('revelation');
  const { data: firstWin, isLoading: dataLoading } = useOnboardingFirstWin();
  const markField = useMarkOnboardingField();
  const updateStep = useUpdateOnboardingStep();

  const handleCta = async () => {
    await markField.mutateAsync('first_win_seen');
    await updateStep.mutateAsync('invested');
    navigate('/onboarding/invested');
  };

  const isSubmitting = markField.isPending || updateStep.isPending;

  if (isGuarding || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#3b5bdb]" />
      </div>
    );
  }

  const win = firstWin;
  const accounts = win?.at_risk_accounts ?? [];
  const totalAccounts = win?.total_accounts ?? 0;
  const mrrAtRisk = win?.mrr_at_risk ?? 0;
  const globalScore = win?.global_health_score ?? 0;

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <OnboardingHeader step={3} totalSteps={5} />

      <div className="mx-auto max-w-3xl px-4 py-10 lg:py-16">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-serif font-bold text-[#111827] mb-3">
            {fr.onboardingV2.revelation.title}
          </h1>
          {totalAccounts > 0 && (
            <p className="text-[#6b7280]">{fr.onboardingV2.revelation.subtitle(totalAccounts)}</p>
          )}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <p className="text-2xl font-bold text-[#111827]">{totalAccounts}</p>
            <p className="text-xs text-[#6b7280] mt-1">{fr.onboardingV2.revelation.totalAccounts}</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <p className="text-2xl font-bold text-red-600">
              {fr.format.currency(mrrAtRisk, currency)}
            </p>
            <p className="text-xs text-[#6b7280] mt-1">{fr.onboardingV2.revelation.mrrAtRisk}</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <p className="text-2xl font-bold text-[#3b5bdb]">{Math.round(globalScore)}</p>
            <p className="text-xs text-[#6b7280] mt-1">{fr.onboardingV2.revelation.globalScore}</p>
          </div>
        </div>

        {/* Top comptes à risque */}
        {accounts.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)] mb-8">
            <p className="text-[#6b7280]">{fr.onboardingV2.revelation.noAccounts}</p>
          </div>
        ) : (
          <div className="space-y-3 mb-8">
            <h2 className="text-sm font-semibold text-[#374151] uppercase tracking-wide">
              {fr.onboardingV2.revelation.topRisk}
            </h2>
            {accounts.slice(0, 3).map((acc, i) => (
              <div
                key={acc.stripe_customer_id}
                className="bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    i === 0 ? 'bg-red-500' : i === 1 ? 'bg-orange-500' : 'bg-amber-500'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-[#111827] truncate">
                      {getAccountLabel(acc)}
                    </p>
                    {acc.top_risk_reason && (
                      <p className="text-xs text-[#6b7280] flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                        {acc.top_risk_reason}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm text-[#6b7280]">{fr.format.currency(acc.mrr * 100, currency)}</span>
                  <Badge
                    variant="secondary"
                    className={`text-xs ${
                      acc.health_score < 30
                        ? 'bg-red-100 text-red-700'
                        : acc.health_score < 50
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {fr.onboardingV2.revelation.healthScore} {Math.round(acc.health_score)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center">
          <Button
            size="lg"
            className="bg-[#3b5bdb] hover:bg-[#3451c7] text-white px-10"
            onClick={handleCta}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {fr.onboardingV2.revelation.ctaLoading}
              </span>
            ) : (
              fr.onboardingV2.revelation.cta
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
