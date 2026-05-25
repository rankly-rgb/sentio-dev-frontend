import type { ReactNode } from 'react';
import WizardStepper from './WizardStepper';
import type { WizardStep } from '@/lib/types/onboarding-wizard';
import type { Language } from '@/lib/i18n/translations';

interface Props {
  steps: WizardStep[];
  locale: Language;
  children: ReactNode;
}

export default function WizardLayout({ steps, locale, children }: Props) {
  const breadcrumb = locale === 'en' ? 'Setup' : 'Configuration';

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b]">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="text-lg font-bold text-[#f8fafc]">Sentio AI</span>
        </div>
        <span className="text-sm text-[#64748b]">{breadcrumb}</span>
      </header>

      {/* Content */}
      <main className="flex flex-col items-center px-4 py-10">
        <div className="w-full max-w-lg">
          {steps.length > 0 && <WizardStepper steps={steps} locale={locale} />}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
