import { useState, useEffect, useCallback } from 'react';
import { useT } from '@/lib/i18n/useT';
import OnboardingStepper from './OnboardingStepper';
import StepConnectStripe from './StepConnectStripe';
import StepImportData from './StepImportData';
import StepFirstWin from './StepFirstWin';
// V2 - HubSpot : import { StepConnectHubspot } from './StepConnectHubspot';

const LS_KEY = 'sentio_onboarding_state';

interface WizardState {
  currentStep: number;
  stripeConnected: boolean;
  stripeMethod: 'api_key' | 'oauth' | null;
  syncCompleted: boolean;
  hubspotConnected: boolean;
}

const DEFAULT_STATE: WizardState = {
  currentStep: 1,
  stripeConnected: false,
  stripeMethod: null,
  syncCompleted: false,
  hubspotConnected: false,
};

function loadState(): WizardState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) } as WizardState;
  } catch {
    // ignore parse errors
  }
  return DEFAULT_STATE;
}

function saveState(state: WizardState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

export default function OnboardingWizard() {
  const t = useT();
  const w = t.onboardingWizard;

  const [state, setState] = useState<WizardState>(loadState);

  const update = (patch: Partial<WizardState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      saveState(next);
      return next;
    });
  };

  // If user completed onboarding previously and revisits, start them at step 1
  useEffect(() => {
    if (state.currentStep < 1 || state.currentStep > 4) {
      update({ currentStep: 1 });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStripeSuccess = (method: 'api_key' | 'oauth') => {
    update({ stripeConnected: true, stripeMethod: method, currentStep: 2 });
  };

  const handleSyncComplete = useCallback(() => {
    update({ syncCompleted: true, currentStep: 3 });
  }, []);  

  const handleGoToHubspot = () => {
    update({ currentStep: 4 });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-500 flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="text-lg font-bold text-gray-900">Sentio AI</span>
        </div>
        <span className="text-sm text-gray-400">{w.header.breadcrumb}</span>
      </header>

      {/* Content */}
      <main className="flex flex-col items-center px-4 py-10">
        <div className="w-full max-w-lg">
          <OnboardingStepper currentStep={state.currentStep} />

          <div className="bg-white rounded-2xl shadow-sm p-8">
            {state.currentStep === 1 && (
              <StepConnectStripe onSuccess={handleStripeSuccess} />
            )}
            {state.currentStep === 2 && (
              <StepImportData onComplete={handleSyncComplete} />
            )}
            {state.currentStep === 3 && (
              <StepFirstWin onConnectHubspot={handleGoToHubspot} />
            )}
            {/* V2 - HubSpot
            {state.currentStep === 4 && (
              <StepConnectHubspot />
            )}
            */}
          </div>
        </div>
      </main>
    </div>
  );
}
