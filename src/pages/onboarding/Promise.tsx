import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useT } from '@/lib/i18n/useT';
import { Button } from '@/components/ui/button';
import OnboardingHeader from '@/components/onboarding/OnboardingHeader';
import { useOnboardingGuard, useUpdateOnboardingStep } from '@/hooks/useOnboardingV2';

export default function Promise() {
  const fr = useT();
  const navigate = useNavigate();
  const { isGuarding } = useOnboardingGuard('promise');
  const updateStep = useUpdateOnboardingStep();

  const handleCta = async () => {
    await updateStep.mutateAsync('stripe');
    navigate('/onboarding/stripe');
  };

  if (isGuarding) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#3b5bdb]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <OnboardingHeader step={1} totalSteps={5} />

      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-65px)] px-6 text-center">
        <div className="max-w-xl">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#111827] leading-snug mb-5">
            {fr.onboardingV2.promise.mainText}
          </h1>
          <p className="text-lg text-[#6b7280] mb-12">
            {fr.onboardingV2.promise.subText}
          </p>
          <Button
            size="lg"
            className="bg-[#3b5bdb] hover:bg-[#3451c7] text-white px-10 py-6 text-lg"
            onClick={handleCta}
            disabled={updateStep.isPending}
          >
            {updateStep.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              fr.onboardingV2.promise.cta
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
