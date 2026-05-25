import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2, AlertTriangle } from 'lucide-react';
import { useT } from '@/lib/i18n/useT';
import { useLanguage } from '@/lib/i18n/useLanguage';
import WizardLayout from '@/components/onboarding/WizardLayout';
import { useOnboardingStatusFull, useSyncStatus } from '@/hooks/useOnboardingWizard';
import { cn } from '@/lib/utils';
import type { WizardStep } from '@/lib/types/onboarding-wizard';

type ItemState = 'pending' | 'active' | 'done';

export default function OnboardingImport() {
  const t = useT();
  const w = t.onboardingWizard.import;
  const { language } = useLanguage();
  const navigate = useNavigate();

  const { data: statusData } = useOnboardingStatusFull();
  const { data: syncStatus, refetch } = useSyncStatus(true);

  const steps: WizardStep[] = statusData?.data.wizard_steps ?? [];

  const [item1, setItem1] = useState<ItemState>('active');
  const [item2, setItem2] = useState<ItemState>('pending');
  const [item3, setItem3] = useState<ItemState>('pending');

  // Step 1 completes after 2s
  useEffect(() => {
    const timer = setTimeout(() => {
      setItem1('done');
      setItem2('active');
    }, 2_000);
    return () => clearTimeout(timer);
  }, []);

  // Advance steps based on sync status
  useEffect(() => {
    if (!syncStatus) return;
    if (syncStatus.steps.behavioral) setItem1('done');
    if (syncStatus.steps.cohorts) { setItem1('done'); setItem2('done'); setItem3('active'); }
    if (syncStatus.status === 'completed' && syncStatus.steps.scores) {
      setItem1('done'); setItem2('done'); setItem3('done');
      setTimeout(() => navigate('/onboarding/first-win', { replace: true }), 1_000);
    }
  }, [syncStatus, navigate]);

  const handleRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  const isError = syncStatus?.status === 'error';

  const items = [
    { state: item1, label: w.item1Full },
    { state: item2, label: w.item2Full },
    { state: item3, label: w.item3Full },
  ];

  return (
    <WizardLayout steps={steps} locale={language}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-[#f8fafc]">{w.title}</h2>
          <p className="mt-1 text-sm text-[#94a3b8]">{w.subtitle}</p>
        </div>

        {isError ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 text-red-400 bg-red-900/20 border border-red-500/20 rounded-lg p-4">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">{w.errorMsg}</p>
                {syncStatus?.error_message && (
                  <p className="text-xs text-red-300 mt-1">{syncStatus.error_message}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleRetry}
              className="w-full rounded-lg py-2.5 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 transition-colors"
            >
              {w.retry}
            </button>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map(({ state, label }, i) => (
              <li
                key={i}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl border transition-colors',
                  state === 'active' && 'bg-indigo-500/10 border-indigo-500/30',
                  state === 'done' && 'bg-green-500/10 border-green-500/20',
                  state === 'pending' && 'bg-[#0f172a] border-[#334155] opacity-40',
                )}
              >
                <div className="flex-shrink-0">
                  {state === 'done' && (
                    <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                  {state === 'active' && <Loader2 className="h-6 w-6 text-indigo-400 animate-spin" />}
                  {state === 'pending' && (
                    <div className="h-6 w-6 rounded-full bg-slate-700 flex items-center justify-center text-xs text-[#64748b] font-bold">
                      {i + 1}
                    </div>
                  )}
                </div>
                <span className={cn(
                  'text-sm font-medium',
                  state === 'done' && 'text-green-400',
                  state === 'active' && 'text-indigo-300',
                  state === 'pending' && 'text-[#64748b]',
                )}>
                  {label}
                </span>
              </li>
            ))}
          </ul>
        )}

        <p className="text-xs text-center text-[#475569]">{w.footer}</p>
      </div>
    </WizardLayout>
  );
}
