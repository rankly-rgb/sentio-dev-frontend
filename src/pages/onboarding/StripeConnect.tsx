import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Check, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';
import { useT } from '@/lib/i18n/useT';
import { useLanguage } from '@/lib/i18n/useLanguage';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import WizardLayout from '@/components/onboarding/WizardLayout';
import { useOnboardingStatusFull, useVerifyStripeToken, useStripeOAuthInitiate } from '@/hooks/useOnboardingWizard';
import { cn } from '@/lib/utils';
import type { WizardStep } from '@/lib/types/onboarding-wizard';

const VALID_PREFIXES = ['rk_live_', 'rk_test_', 'sk_live_', 'sk_test_'];

type Tab = 'key' | 'oauth';
type SubmitState = 'idle' | 'loading' | 'success' | 'error';

export default function StripeConnect() {
  const t = useT();
  const w = t.onboardingWizard.stripe;
  const { language } = useLanguage();
  const navigate = useNavigate();

  const { data: statusData, isLoading } = useOnboardingStatusFull();
  const verify = useVerifyStripeToken();
  const initiateOAuth = useStripeOAuthInitiate();

  const [tab, setTab] = useState<Tab>('key');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [error, setError] = useState('');

  const steps: WizardStep[] = statusData?.data.wizard_steps ?? [];

  // Guard: redirect if already done
  useEffect(() => {
    if (!statusData) return;
    const { current_step, onboarding_completed } = statusData.data;
    if (onboarding_completed || current_step !== 'stripe') {
      navigate('/onboarding/promise', { replace: true });
    }
  }, [statusData, navigate]);

  const handleKeySubmit = async () => {
    if (!VALID_PREFIXES.some((p) => apiKey.startsWith(p))) {
      setError(w.keyError);
      return;
    }
    setError('');
    setSubmitState('loading');
    try {
      const result = await verify.mutateAsync(apiKey);
      if (result.success) {
        setSubmitState('success');
        setTimeout(() => navigate('/onboarding/import'), 800);
      } else {
        setError(result.error ?? w.ctaError);
        setSubmitState('error');
      }
    } catch {
      setError(w.ctaError);
      setSubmitState('error');
    }
  };

  const handleOAuth = async () => {
    try {
      const { url } = await initiateOAuth.mutateAsync();
      window.location.href = url;
    } catch {
      setError(w.ctaError);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  const syncItems = [
    w.syncSubs,
    w.syncMrr,
    w.syncInvoices,
  ];

  return (
    <WizardLayout steps={steps} locale={language}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-[#f8fafc]">{w.title}</h2>
          <p className="mt-1 text-sm text-[#94a3b8]">{w.subtitle}</p>
        </div>

        {/* Mode tabs */}
        <div className="flex rounded-lg border border-[#334155] overflow-hidden">
          {(['key', 'oauth'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setError(''); setSubmitState('idle'); }}
              className={cn(
                'flex-1 py-2 text-sm font-medium transition-colors',
                tab === t
                  ? 'bg-indigo-500 text-white'
                  : 'text-[#94a3b8] hover:text-[#f8fafc]',
              )}
            >
              {t === 'key' ? w.tabKey : w.tabOAuth}
            </button>
          ))}
        </div>

        {tab === 'key' && (
          <div className="space-y-4">
            <div className="bg-[#0f172a] rounded-xl p-4 text-sm space-y-2">
              <p className="font-medium text-[#94a3b8]">{w.instructionsTitle}</p>
              <ol className="space-y-1 text-[#64748b] list-decimal list-inside">
                {[w.instrStep1, w.instrStep2, w.instrStep3, w.instrStep4].map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="stripe-key" className="text-sm text-[#94a3b8]">{w.keyLabel}</Label>
              <div className="relative">
                <Input
                  id="stripe-key"
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => { setApiKey(e.target.value); setError(''); if (submitState === 'error') setSubmitState('idle'); }}
                  placeholder={w.keyPlaceholder}
                  className="pr-10 bg-[#0f172a] border-[#334155] text-[#f8fafc] placeholder:text-[#475569] focus-visible:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#94a3b8]"
                  tabIndex={-1}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
            </div>

            <button
              type="button"
              onClick={handleKeySubmit}
              disabled={submitState === 'loading' || submitState === 'success' || !apiKey}
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
          </div>
        )}

        {tab === 'oauth' && (
          <div className="space-y-4">
            <p className="text-sm text-[#94a3b8]">{w.oauthLabel}</p>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="button"
              onClick={handleOAuth}
              disabled={initiateOAuth.isPending}
              className="w-full rounded-lg py-3 text-sm font-semibold text-white bg-indigo-500 hover:bg-indigo-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {initiateOAuth.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {w.oauthCta}
            </button>
          </div>
        )}

        {/* Synchronized data */}
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
        </div>

        {/* Zero PII badge */}
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-900/30 border border-emerald-500/20 rounded-lg px-3 py-2">
          <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0" />
          {w.zeroPiiBadge}
        </div>
      </div>
    </WizardLayout>
  );
}
