// V2 - HubSpot : page masquée en V1.
// Le flux onboarding saute cette étape (SyncWait navigue directement vers /onboarding/done).
// Ce composant redirige automatiquement si quelqu'un atteint la route directement.
// Pour réactiver en V2 : restaurer le code commenté ci-dessous et mettre à jour SyncWait.
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function HubSpot() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/onboarding/done', { replace: true }); }, [navigate]);
  return null;
}

/* V2 - HubSpot : code original conservé
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Check, ShieldCheck, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { useT } from '@/lib/i18n/useT';
import { useLanguage } from '@/lib/i18n/useLanguage';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import WizardLayout from '@/components/onboarding/WizardLayout';
import { useOnboardingStatusFull, useHubspotConnect } from '@/hooks/useOnboardingWizard';
import { useMarkOnboardingField } from '@/hooks/useOnboardingFlow';
import { cn } from '@/lib/utils';
import type { WizardStep } from '@/lib/types/onboarding-wizard';

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

export default function HubSpot() {
  const t = useT();
  const w = t.onboardingWizard.hubspot;
  const { language } = useLanguage();
  const navigate = useNavigate();

  const { data: statusData } = useOnboardingStatusFull();
  const connect = useHubspotConnect();
  const markField = useMarkOnboardingField();

  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [error, setError] = useState('');

  const steps: WizardStep[] = statusData?.data.wizard_steps ?? [];

  const finishOnboarding = async () => {
    await markField.mutateAsync('onboarding_completed');
    navigate('/dashboard', { replace: true });
  };

  const handleConnect = async () => {
    if (!token.startsWith('pat-')) {
      setError(w.tokenError);
      return;
    }
    setError('');
    setSubmitState('loading');
    try {
      await connect.mutateAsync(token);
      setSubmitState('success');
      setTimeout(() => void finishOnboarding(), 800);
    } catch {
      setError(w.tokenError);
      setSubmitState('error');
    }
  };

  const handleSkip = async () => {
    await finishOnboarding();
  };

  const syncItems = [w.sync1, w.sync2];

  return (
    <WizardLayout steps={steps} locale={language}>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-[#f8fafc]">{w.title}</h2>
            <p className="mt-1 text-sm text-[#94a3b8]">{w.subtitle}</p>
          </div>
          <span className="flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
            {w.optionalBadge}
          </span>
        </div>

        <div className="bg-[#0f172a] rounded-xl p-4 text-sm space-y-2">
          <p className="font-medium text-[#94a3b8]">{w.instructionsTitle}</p>
          <ol className="space-y-1 text-[#64748b] list-decimal list-inside">
            {[w.instrStep1, w.instrStep2, w.instrStep3, w.instrStep4].map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="hubspot-token" className="text-sm text-[#94a3b8]">{w.tokenLabel}</Label>
          <div className="relative">
            <Input
              id="hubspot-token"
              type={showToken ? 'text' : 'password'}
              value={token}
              onChange={(e) => { setToken(e.target.value); setError(''); if (submitState === 'error') setSubmitState('idle'); }}
              placeholder={w.tokenPlaceholder}
              className="pr-10 bg-[#0f172a] border-[#334155] text-[#f8fafc] placeholder:text-[#475569] focus-visible:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => setShowToken((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#94a3b8]"
              tabIndex={-1}
            >
              {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        <button
          type="button"
          onClick={handleConnect}
          disabled={submitState === 'loading' || submitState === 'success' || !token}
          className={cn(
            'w-full rounded-lg py-3 text-sm font-semibold text-white transition-colors disabled:opacity-50',
            submitState === 'success' ? 'bg-green-600' : 'bg-indigo-500 hover:bg-indigo-600',
          )}
        >
          {submitState === 'loading' && (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />{w.ctaLoading}
            </span>
          )}
          {submitState === 'success' && (
            <span className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4" />{w.ctaSuccess}
            </span>
          )}
          {(submitState === 'idle' || submitState === 'error') && w.cta}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={handleSkip}
            disabled={markField.isPending}
            className="text-sm text-[#475569] hover:text-[#94a3b8] transition-colors inline-flex items-center gap-1 disabled:opacity-50"
          >
            {markField.isPending
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> {w.ctaLoading}</>
              : <>{w.skip} <ArrowRight className="h-3.5 w-3.5" /></>
            }
          </button>
        </div>

        <div className="border-t border-[#334155] pt-5">
          <p className="text-xs font-medium text-[#64748b] uppercase tracking-wide mb-3">{w.syncTitle}</p>
          <ul className="space-y-2">
            {syncItems.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-[#94a3b8]">
                <Check className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-xs text-emerald-400 mt-3">{w.pushBadge}</p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-900/30 border border-emerald-500/20 rounded-lg px-3 py-2">
          <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0" />
          {w.zeroPiiBadge}
        </div>
      </div>
    </WizardLayout>
  );
}
*/
