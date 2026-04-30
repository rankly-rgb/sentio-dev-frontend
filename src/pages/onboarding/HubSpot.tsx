import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { fr } from '@/i18n/fr';
import { Button } from '@/components/ui/button';
import OnboardingHeader from '@/components/onboarding/OnboardingHeader';
import { useOnboardingFlowStatus } from '@/hooks/useOnboardingFlow';

export default function HubSpot() {
  const navigate = useNavigate();
  const { data: status, isPending: statusLoading } = useOnboardingFlowStatus();

  const handleConnect = () => {
    // Trigger HubSpot OAuth flow — redirects to backend-managed OAuth
    window.location.href = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hubspot-oauth-init`;
  };

  const handleSkip = () => {
    navigate('/onboarding/done');
  };

  const accountsCount = status?.accounts_count ?? 0;

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <OnboardingHeader step={2} totalSteps={2} />

      <div className="mx-auto max-w-5xl px-4 py-10 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Colonne gauche — Instructions */}
          <div>
            <h1 className="text-3xl font-serif font-bold text-[#111827] mb-2">
              {fr.onboarding.hubspot.title}
            </h1>
            <p className="text-[#6b7280] mb-5">{fr.onboarding.hubspot.subtitle}</p>

            {/* Stripe badge */}
            {!statusLoading && accountsCount > 0 && (
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-medium px-3 py-1.5 rounded-full mb-8">
                <CheckCircle className="h-3.5 w-3.5" />
                {fr.onboarding.hubspot.stripeBadge(accountsCount)}
              </div>
            )}

            {/* Steps */}
            <ol className="space-y-4 mb-8">
              {[
                fr.onboarding.hubspot.step1,
                fr.onboarding.hubspot.step2,
                fr.onboarding.hubspot.step3,
              ].map((text, i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex-shrink-0 h-7 w-7 rounded-full bg-[#3b5bdb] text-white text-xs font-semibold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-sm text-[#111827] pt-1">{text}</span>
                </li>
              ))}
            </ol>

            <Button
              onClick={handleConnect}
              className="w-full bg-[#3b5bdb] hover:bg-[#3451c7] text-white mb-4"
            >
              {statusLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                fr.onboarding.hubspot.cta
              )}
            </Button>

            <div className="text-center space-y-1">
              <button
                type="button"
                onClick={handleSkip}
                className="text-sm text-[#6b7280] hover:text-[#111827] flex items-center gap-1 mx-auto"
              >
                {fr.onboarding.hubspot.skip}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <p className="text-xs text-[#6b7280]">{fr.onboarding.hubspot.skipNote}</p>
            </div>
          </div>

          {/* Colonne droite — Valeur HubSpot */}
          <div>
            <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6">
              <h2 className="text-base font-semibold text-[#111827] mb-4">
                {fr.onboarding.hubspot.withTitle}
              </h2>

              <ul className="space-y-3 mb-6">
                {[
                  fr.onboarding.hubspot.with1,
                  fr.onboarding.hubspot.with2,
                  fr.onboarding.hubspot.with3,
                  fr.onboarding.hubspot.with4,
                ].map((text) => (
                  <li key={text} className="flex items-center gap-2 text-sm text-[#111827]">
                    <CheckCircle className="h-4 w-4 text-[#22c55e] flex-shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>

              <div className="border-t border-[#e5e7eb] pt-5">
                <h3 className="text-sm font-semibold text-[#111827] mb-3">
                  {fr.onboarding.hubspot.withoutTitle}
                </h3>
                <ul className="space-y-2">
                  {[
                    fr.onboarding.hubspot.without1,
                    fr.onboarding.hubspot.without2,
                    fr.onboarding.hubspot.without3,
                  ].map((text) => (
                    <li key={text} className="flex items-center gap-2 text-sm text-[#6b7280]">
                      <ArrowRight className="h-4 w-4 flex-shrink-0" />
                      {text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
