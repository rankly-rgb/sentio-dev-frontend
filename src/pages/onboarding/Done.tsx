import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useT } from '@/lib/i18n/useT';
import { Button } from '@/components/ui/button';
import OnboardingHeader from '@/components/onboarding/OnboardingHeader';
import { useOnboardingFirstWin, useMarkOnboardingField } from '@/hooks/useOnboardingFlow';
import type { OnboardingFirstWinAccount } from '@/lib/types/onboarding-flow';

function scoreBadgeClass(score: number) {
  if (score < 40) return 'bg-red-100 text-red-700';
  if (score < 60) return 'bg-orange-100 text-orange-700';
  return 'bg-green-100 text-green-700';
}

function scoreBadgeLabel(score: number, labels: { criticalRisk: string; moderateRisk: string; healthy: string }) {
  if (score < 40) return labels.criticalRisk;
  if (score < 60) return labels.moderateRisk;
  return labels.healthy;
}

function AccountCard({ account, index }: { account: OnboardingFirstWinAccount; index: number }) {
  const fr = useT();
  const name = account.display_name ?? account.stripe_customer_id;
  const badgeClass = scoreBadgeClass(account.health_score);
  const badgeLabel = scoreBadgeLabel(account.health_score, fr.onboarding.done);

  return (
    <div
      className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] opacity-0 animate-fade-in-up"
      style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'forwards' }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444] flex-shrink-0" />
          <span className="font-medium text-sm text-[#111827] truncate">{name}</span>
        </div>
        <span className="text-sm font-semibold text-[#111827] flex-shrink-0 whitespace-nowrap">
          {account.mrr.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
          /mois
        </span>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs text-[#6b7280]">
          {fr.onboarding.done.healthScore} : {account.health_score}/100
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeClass}`}>
          {badgeLabel}
        </span>
      </div>

      {account.top_risk_reason && (
        <p className="text-xs text-[#6b7280] mb-3">· {account.top_risk_reason}</p>
      )}

      <a
        href={`/accounts?search=${encodeURIComponent(account.stripe_customer_id)}`}
        className="text-xs text-[#3b5bdb] hover:underline"
      >
        {fr.onboarding.done.viewAccount}
      </a>
    </div>
  );
}

export default function Done() {
  const fr = useT();
  const navigate = useNavigate();
  const { data: firstWin, isPending: isLoading } = useOnboardingFirstWin();
  const { mutate: markField, isPending: isMarking } = useMarkOnboardingField();

  const handleGoToDashboard = () => {
    markField('first_win_seen', {
      onSuccess: () => {
        markField('onboarding_completed', {
          onSuccess: () => navigate('/dashboard'),
          onError: () => navigate('/dashboard'),
        });
      },
      onError: () => navigate('/dashboard'),
    });
  };

  // Mark first_win_seen as soon as the page loads
  useEffect(() => {
    markField('first_win_seen');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const topAccounts = firstWin?.at_risk_accounts?.slice(0, 3) ?? [];
  const atRiskCount = topAccounts.length;

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <OnboardingHeader />

      <div className="mx-auto max-w-[720px] px-4 py-12">
        {/* Section 1 — Célébration */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6 animate-success-check">
            <CheckCircle className="h-8 w-8 text-[#22c55e]" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#111827] mb-3">
            {fr.onboarding.done.title}
          </h1>
          {firstWin && (
            <p className="text-[#6b7280] text-lg">
              {fr.onboarding.done.subtitle(firstWin.total_accounts)}
            </p>
          )}
        </div>

        {/* Section 2 — Metrics */}
        {firstWin && (
          <div className="grid grid-cols-3 gap-4 mb-10">
            <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 text-center">
              <p className="text-2xl font-bold text-[#111827]">{firstWin.total_accounts}</p>
              <p className="text-xs text-[#6b7280] mt-1">{fr.onboarding.done.totalAccounts}</p>
            </div>
            <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 text-center">
              <p className={`text-2xl font-bold ${firstWin.at_risk_accounts.length > 0 ? 'text-[#ef4444]' : 'text-[#111827]'}`}>
                {firstWin.at_risk_accounts.length}
              </p>
              <p className="text-xs text-[#6b7280] mt-1">{fr.onboarding.done.atRisk}</p>
            </div>
            <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 text-center">
              <p className={`text-2xl font-bold ${firstWin.mrr_at_risk > 0 ? 'text-[#ef4444]' : 'text-[#111827]'}`}>
                {firstWin.mrr_at_risk.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-[#6b7280] mt-1">{fr.onboarding.done.mrrAtRisk}</p>
            </div>
          </div>
        )}

        {/* Section 3 — Top comptes à risque */}
        <div className="mb-10">
          <h2 className="text-base font-semibold text-[#111827] mb-4">
            {fr.onboarding.done.priorityTitle}
          </h2>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 text-[#3b5bdb] animate-spin" />
            </div>
          ) : atRiskCount === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <p className="text-lg font-semibold text-green-700 mb-1">
                {fr.onboarding.done.noRisk}
              </p>
              <p className="text-sm text-green-600">{fr.onboarding.done.noRiskSubtitle}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topAccounts.map((account, i) => (
                <AccountCard key={account.stripe_customer_id} account={account} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* Section 4 — CTA */}
        <div className="text-center">
          <Button
            onClick={handleGoToDashboard}
            disabled={isMarking}
            className="bg-[#3b5bdb] hover:bg-[#3451c7] text-white px-8 py-3 text-base h-auto"
          >
            {isMarking ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {fr.onboarding.done.ctaLoading}
              </span>
            ) : (
              fr.onboarding.done.cta
            )}
          </Button>
          <p className="mt-3 text-xs text-[#6b7280]">{fr.onboarding.done.hubspotNote}</p>
        </div>
      </div>

      <style>{`
        @keyframes successCheck {
          0% { transform: scale(0); opacity: 0; }
          70% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-success-check {
          animation: successCheck 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
