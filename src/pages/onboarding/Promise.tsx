import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useOnboardingStatusFull } from '@/hooks/useOnboardingWizard';
import type { CurrentStep } from '@/lib/types/onboarding-wizard';

const STEP_TO_PATH: Record<CurrentStep, string> = {
  stripe: '/onboarding/stripe',
  first_win: '/onboarding/first-win',
  hubspot: '/onboarding/hubspot',
  done: '/dashboard',
};

/** Entry point after email confirmation — reads status and redirects to the correct step. */
export default function Promise() {
  const navigate = useNavigate();
  const { data: statusData, isLoading } = useOnboardingStatusFull();

  useEffect(() => {
    if (!statusData) return;
    const { current_step, onboarding_completed } = statusData.data;
    if (onboarding_completed) {
      navigate('/dashboard', { replace: true });
      return;
    }
    navigate(STEP_TO_PATH[current_step] ?? '/onboarding/stripe', { replace: true });
  }, [statusData, navigate]);

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      {isLoading && <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />}
    </div>
  );
}
