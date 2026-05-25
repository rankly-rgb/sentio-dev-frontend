import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WizardStep } from '@/lib/types/onboarding-wizard';
import type { Language } from '@/lib/i18n/translations';

interface Props {
  steps: WizardStep[];
  locale: Language;
}

export default function WizardStepper({ steps, locale }: Props) {
  return (
    <div className="flex items-start justify-center gap-0 mb-10">
      {steps.map((step, index) => {
        const isCompleted = step.status === 'completed';
        const isActive = step.status === 'active';
        const label = locale === 'en' ? step.label_en : step.label_fr;

        return (
          <div key={step.id} className="flex items-start">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                  isCompleted && 'bg-green-500 text-white',
                  isActive && 'bg-indigo-500 text-white',
                  !isCompleted && !isActive && 'bg-slate-700 text-[#94a3b8]',
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span
                className={cn(
                  'mt-1.5 text-xs text-center max-w-[72px] leading-tight',
                  isActive ? 'text-indigo-400 font-medium' : 'text-[#64748b]',
                )}
              >
                {label}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-14 mt-4 mx-1 transition-colors',
                  isCompleted ? 'bg-green-500' : 'bg-slate-700',
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
