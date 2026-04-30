import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fr } from '@/i18n/fr';
import { Button } from '@/components/ui/button';
import OnboardingHeader from '@/components/onboarding/OnboardingHeader';
import { useOnboardingFlowStatus } from '@/hooks/useOnboardingFlow';

const SYNC_STEPS = [
  fr.onboarding.sync.step0,
  fr.onboarding.sync.step1,
  fr.onboarding.sync.step2,
  fr.onboarding.sync.step3,
];

const STEP_THRESHOLDS_MS = [0, 3_000, 8_000, 15_000];
const TIMEOUT_MS = 3 * 60_000;
const POLL_INTERVAL_MS = 3_000;

export default function SyncWait() {
  const navigate = useNavigate();
  const { data: status, refetch } = useOnboardingFlowStatus();

  const [syncStep, setSyncStep] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const startRef = useRef(Date.now());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update progress label based on elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      let step = 0;
      for (let i = STEP_THRESHOLDS_MS.length - 1; i >= 0; i--) {
        if (elapsed >= STEP_THRESHOLDS_MS[i]) {
          step = i;
          break;
        }
      }
      setSyncStep(step);
    }, 1_000);

    return () => clearInterval(interval);
  }, []);

  // Polling
  useEffect(() => {
    pollRef.current = setInterval(() => {
      refetch();
    }, POLL_INTERVAL_MS);

    timeoutRef.current = setTimeout(() => {
      setTimedOut(true);
      if (pollRef.current) clearInterval(pollRef.current);
    }, TIMEOUT_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [refetch]);

  // Redirect on completion
  useEffect(() => {
    if (status?.stripe_sync_completed) {
      navigate('/onboarding/hubspot', { replace: true });
    }
  }, [status?.stripe_sync_completed, navigate]);

  const handleRefresh = () => {
    setTimedOut(false);
    startRef.current = Date.now();
    refetch();
    pollRef.current = setInterval(() => refetch(), POLL_INTERVAL_MS);
    timeoutRef.current = setTimeout(() => {
      setTimedOut(true);
      if (pollRef.current) clearInterval(pollRef.current);
    }, TIMEOUT_MS);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <OnboardingHeader step={1} totalSteps={2} />

      <div className="mx-auto max-w-[560px] px-4 py-16">
        <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-8 text-center">
          <h1 className="text-2xl font-serif font-bold text-[#111827] mb-2">
            {fr.onboarding.sync.title}
          </h1>
          <p className="text-[#6b7280] mb-8">{fr.onboarding.sync.subtitle}</p>

          {/* Progress bar */}
          <div className="relative h-2 bg-[#e5e7eb] rounded-full overflow-hidden mb-3">
            <div className="absolute inset-y-0 left-0 bg-[#3b5bdb] rounded-full animate-pulse w-2/3" />
          </div>
          <p className="text-sm text-[#6b7280] mb-8 h-5">
            {SYNC_STEPS[syncStep]}
          </p>

          {/* Accounts counter */}
          {(status?.accounts_count ?? 0) > 0 && (
            <div className="mb-8">
              <span className="text-4xl font-bold text-[#3b5bdb]">
                {status!.accounts_count}
              </span>
              <p className="text-sm text-[#6b7280] mt-1">{fr.onboarding.sync.accountsAnalyzed}</p>
            </div>
          )}

          {/* Timeout state */}
          {timedOut && (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-[#6b7280]">{fr.onboarding.sync.timeoutMsg}</p>
              <Button
                onClick={handleRefresh}
                className="bg-[#3b5bdb] hover:bg-[#3451c7] text-white"
              >
                {fr.onboarding.sync.timeoutRefresh}
              </Button>
              <p className="text-xs text-[#6b7280]">
                <a href="mailto:support@sentio.ai" className="underline hover:text-[#111827]">
                  {fr.onboarding.sync.timeoutSupport}
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
