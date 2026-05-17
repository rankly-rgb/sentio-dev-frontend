import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useOnboardingStatusV2 } from '@/hooks/useOnboardingV2';

const STEP_TO_PATH: Record<string, string> = {
  promise: '/onboarding/promise',
  stripe: '/onboarding/stripe',
  revelation: '/onboarding/revelation',
  invested: '/onboarding/invested',
  hubspot: '/onboarding/hubspot',
  completed: '/dashboard',
};

/** Point d'entrée `/onboarding` — redirige vers la bonne étape. */
export default function OnboardingV2() {
  const navigate = useNavigate();
  const { data: status, isLoading } = useOnboardingStatusV2();

  useEffect(() => {
    if (!status) return;
    if (status.onboarding_completed) {
      navigate('/dashboard', { replace: true });
      return;
    }
    const path = STEP_TO_PATH[status.onboarding_step] ?? '/onboarding/promise';
    navigate(path, { replace: true });
  }, [status, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#3b5bdb]" />
      </div>
    );
  }

  return null;
}
