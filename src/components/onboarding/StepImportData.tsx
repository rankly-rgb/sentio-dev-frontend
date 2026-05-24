import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useT } from '@/lib/i18n/useT';
import { useSyncStatus } from '@/hooks/useOnboardingWizard';
import { cn } from '@/lib/utils';

interface Props {
  onComplete: () => void;
}

type ItemState = 'pending' | 'active' | 'done';

export default function StepImportData({ onComplete }: Props) {
  const t = useT();
  const w = t.onboardingWizard.import;
  const { data: syncStatus } = useSyncStatus(true);

  // Animated item states — step 1 completes after 2s, step 2 while polling, step 3 when done
  const [item1, setItem1] = useState<ItemState>('active');
  const [item2, setItem2] = useState<ItemState>('pending');
  const [item3, setItem3] = useState<ItemState>('pending');

  useEffect(() => {
    const timer = setTimeout(() => {
      setItem1('done');
      setItem2('active');
    }, 2_000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!syncStatus) return;
    if (syncStatus.steps.cohorts) {
      setItem2('done');
      setItem3('active');
    }
    if (syncStatus.status === 'completed') {
      setItem2('done');
      setItem3('done');
      onComplete();
    }
  }, [syncStatus, onComplete]);

  const items = [
    { state: item1, label: w.item1, desc: w.item1desc },
    { state: item2, label: w.item2, desc: w.item2desc },
    { state: item3, label: w.item3, desc: w.item3desc },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">{w.title}</h2>
        <p className="mt-1 text-sm text-gray-500">{w.subtitle}</p>
      </div>

      <ul className="space-y-4">
        {items.map(({ state, label, desc }, i) => (
          <li
            key={i}
            className={cn(
              'flex items-start gap-4 p-4 rounded-xl transition-colors',
              state === 'active' && 'bg-indigo-50',
              state === 'done' && 'bg-green-50',
              state === 'pending' && 'bg-gray-50 opacity-50',
            )}
          >
            <div className="flex-shrink-0 mt-0.5">
              {state === 'done' && (
                <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="h-3.5 w-3.5 text-white" />
                </div>
              )}
              {state === 'active' && (
                <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
              )}
              {state === 'pending' && (
                <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-500">
                  {i + 1}
                </div>
              )}
            </div>
            <div>
              <p
                className={cn(
                  'text-sm font-medium',
                  state === 'done' && 'text-green-700',
                  state === 'active' && 'text-indigo-700',
                  state === 'pending' && 'text-gray-500',
                )}
              >
                {label}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </div>
          </li>
        ))}
      </ul>

      <p className="text-xs text-center text-gray-400">{w.footer}</p>
    </div>
  );
}
