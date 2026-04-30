import { Target } from 'lucide-react';

interface Props {
  step?: number;
  totalSteps?: number;
}

export default function OnboardingHeader({ step, totalSteps }: Props) {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#e5e7eb]">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-sm">
          <Target className="h-4 w-4 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight text-[#111827]">Sentio AI</span>
          <span className="text-[10px] text-[#6b7280] uppercase tracking-widest font-medium">
            SaaS Intelligence
          </span>
        </div>
      </div>

      {step !== undefined && totalSteps !== undefined && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#6b7280]">
            Étape {step} sur {totalSteps}
          </span>
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <span
                key={i}
                className={`h-2 w-2 rounded-full transition-colors ${
                  i < step ? 'bg-[#3b5bdb]' : 'bg-[#e5e7eb]'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
