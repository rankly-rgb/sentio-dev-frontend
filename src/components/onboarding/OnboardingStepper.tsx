import { Check } from 'lucide-react';
import { useT } from '@/lib/i18n/useT';
import { cn } from '@/lib/utils';

interface Props {
  currentStep: number; // 1-4
}

export default function OnboardingStepper({ currentStep }: Props) {
  const t = useT();
  const w = t.onboardingWizard;

  const steps = [
    { label: w.stepper.step1 },
    { label: w.stepper.step2 },
    { label: w.stepper.step3 },
    { label: w.stepper.step4, optional: true },
  ];

  return (
    <div className="flex items-start justify-center gap-0 mb-8">
      {steps.map((step, index) => {
        const num = index + 1;
        const isCompleted = num < currentStep;
        const isActive = num === currentStep;

        return (
          <div key={num} className="flex items-start">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                  isCompleted && 'bg-green-500 text-white',
                  isActive && 'bg-indigo-600 text-white',
                  !isCompleted && !isActive && 'bg-gray-200 text-gray-500',
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : num}
              </div>
              <span
                className={cn(
                  'mt-1.5 text-xs text-center max-w-[80px] leading-tight',
                  isActive ? 'text-indigo-600 font-medium' : 'text-gray-400',
                )}
              >
                {step.label}
                {step.optional && (
                  <span className="block text-[10px] text-gray-400">
                    ({w.stepper.optional})
                  </span>
                )}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-16 mt-4 mx-1 transition-colors',
                  num < currentStep ? 'bg-green-400' : 'bg-gray-200',
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
