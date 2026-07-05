import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WizardStep } from '@/lib/types/onboarding-wizard';

interface Props {
  steps: WizardStep[];
}

export default function WizardStepper({ steps }: Props) {
  const activeIndex = steps.findIndex((s) => s.status === 'active');
  const activeStep = activeIndex >= 0 ? steps[activeIndex] : null;
  const displayNumber = activeIndex >= 0 ? activeIndex + 1 : steps.length;
  const mobileLabel = activeStep ? activeStep.label_en : '';
  const mobilePrefix = 'Step';

  return (
    <>
      {/* Mobile: compact step indicator */}
      <div className="flex sm:hidden items-center justify-center mb-6">
        <span className="text-sm text-[#94a3b8]">
          {mobilePrefix} {displayNumber}/{steps.length}
          {mobileLabel && (
            <> — <span className="text-indigo-400 font-medium">{mobileLabel}</span></>
          )}
        </span>
      </div>

      {/* Desktop: full stepper */}
      <div className="hidden sm:flex items-start justify-center gap-0 mb-10">
        {steps.map((step, index) => {
          const isCompleted = step.status === 'completed';
          const isActive = step.status === 'active';
          const label = step.label_en;

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
    </>
  );
}
