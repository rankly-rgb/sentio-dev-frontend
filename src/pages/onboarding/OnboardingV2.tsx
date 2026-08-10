// STAGED FOR V2, NOT DEAD CODE — see src/hooks/useOnboardingV2.ts header.
// Mounted at bare '/onboarding', but the live signup chain (Signup ->
// Promise -> StripeConnect -> ...) never routes here — only a defensive
// StripeCallback.tsx fallback used to, fixed in commit 7bf5513 because it
// pointed here by mistake instead of into the live flow.
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';

export default function OnboardingV2() {
  return <OnboardingWizard />;
}
