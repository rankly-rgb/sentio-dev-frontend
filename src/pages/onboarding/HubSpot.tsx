import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useT } from '@/lib/i18n/useT';
import { Button } from '@/components/ui/button';
import OnboardingHeader from '@/components/onboarding/OnboardingHeader';
import { useOnboardingFlowStatus, useMarkOnboardingField } from '@/hooks/useOnboardingFlow';
import { useOnboardingGuard, useUpdateOnboardingStep } from '@/hooks/useOnboardingV2';

export default function HubSpot() {
  const fr = useT();
  const navigate = useNavigate();
  const { isGuarding } = useOnboardingGuard('hubspot');
  const { data: status } = useOnboardingFlowStatus();
  const markField = useMarkOnboardingField();
  const updateStep = useUpdateOnboardingStep();

  const handleConnect = () => {
    window.location.href = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hubspot-oauth-init`;
  };

  const handleSkip = async () => {
    await updateStep.mutateAsync('completed');
    await markField.mutateAsync('onboarding_completed');
    navigate('/dashboard', { replace: true });
  };

  const isSubmitting = updateStep.isPending || markField.isPending;
  const accountsCount = status?.accounts_count ?? 0;

  if (isGuarding) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#3b5bdb]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <OnboardingHeader step={5} totalSteps={5} />

      <div className="mx-auto max-w-5xl px-4 py-10 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div>
            <h1 className="text-3xl font-serif font-bold text-[#111827] mb-2">
              {fr.onboarding.hubspot.title}
            </h1>
            <p className="text-[#6b7280] mb-5">{fr.onboarding.hubspot.subtitle}</p>

            {accountsCount > 0 && (
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-medium px-3 py-1.5 rounded-full mb-8">
                <CheckCircle className="h-3.5 w-3.5" />
                {fr.onboarding.hubspot.stripeBadge(accountsCount)}
              </div>
            )}

            <ol className="space-y-4 mb-8">
              {[fr.onboarding.hubspot.step1, fr.onboarding.hubspot.step2, fr.onboarding.hubspot.step3].map((text, i) => (
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
              {fr.onboarding.hubspot.cta}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleSkip}
                disabled={isSubmitting}
                className="text-sm text-[#6b7280] hover:text-[#111827] flex items-center gap-1 mx-auto disabled:opacity-50"
              >
                {isSubmitting
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {fr.onboardingV2.hubspot.completing}</>
                  : <>{fr.onboardingV2.hubspot.skip} <ArrowRight className="h-3.5 w-3.5" /></>
                }
              </button>
            </div>
          </div>

          <div>
            <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6">
              <h2 className="text-base font-semibold text-[#111827] mb-4">{fr.onboarding.hubspot.withTitle}</h2>
              <ul className="space-y-3 mb-6">
                {[fr.onboarding.hubspot.with1, fr.onboarding.hubspot.with2, fr.onboarding.hubspot.with3, fr.onboarding.hubspot.with4].map(text => (
                  <li key={text} className="flex items-center gap-2 text-sm text-[#111827]">
                    <CheckCircle className="h-4 w-4 text-[#22c55e] flex-shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>
              <div className="border-t border-[#e5e7eb] pt-5">
                <h3 className="text-sm font-semibold text-[#111827] mb-3">{fr.onboarding.hubspot.withoutTitle}</h3>
                <ul className="space-y-2">
                  {[fr.onboarding.hubspot.without1, fr.onboarding.hubspot.without2, fr.onboarding.hubspot.without3].map(text => (
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
