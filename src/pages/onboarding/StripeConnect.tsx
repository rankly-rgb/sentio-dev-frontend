import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle, XCircle, ExternalLink, Lock, Loader2 } from 'lucide-react';
import { useT } from '@/lib/i18n/useT';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import OnboardingHeader from '@/components/onboarding/OnboardingHeader';
import { useSaveIntegrationsConfig } from '@/hooks/useOnboardingFlow';
import { useOnboardingFlowStatus } from '@/hooks/useOnboardingFlow';
import { useOnboardingGuard, useUpdateOnboardingStep } from '@/hooks/useOnboardingV2';

function isValidStripeKey(key: string) {
  return key.startsWith('sk_live_') || key.startsWith('sk_test_') || key.startsWith('rk_live_') || key.startsWith('rk_test_');
}

export default function StripeConnect() {
  const fr = useT();
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [formatError, setFormatError] = useState(false);
  const [polling, setPolling] = useState(false);

  const { isGuarding } = useOnboardingGuard('stripe');
  const { mutateAsync: saveConfig, isPending, isError } = useSaveIntegrationsConfig();
  const updateStep = useUpdateOnboardingStep();
  const { data: onboardingStatus, refetch: refetchStatus } = useOnboardingFlowStatus();

  // Polling quand clé soumise avec succès
  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(async () => {
      const result = await refetchStatus();
      if (result.data?.stripe_connected) {
        clearInterval(interval);
        await updateStep.mutateAsync('revelation');
        navigate('/onboarding/revelation');
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [polling, refetchStatus, updateStep, navigate]);

  // Si Stripe déjà connecté à l'arrivée, avancer directement
  useEffect(() => {
    if (onboardingStatus?.stripe_connected && !polling) {
      updateStep.mutateAsync('revelation').then(() => {
        navigate('/onboarding/revelation');
      });
    }
  }, [onboardingStatus?.stripe_connected, polling, updateStep, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const key = apiKey.trim();
    if (!key) return;
    if (!isValidStripeKey(key)) {
      setFormatError(true);
      return;
    }
    setFormatError(false);
    try {
      await saveConfig({ provider: 'stripe', api_key: key });
      setPolling(true);
    } catch {
      // isError affichage géré
    }
  };

  const handleSkip = async () => {
    await updateStep.mutateAsync('revelation');
    navigate('/onboarding/revelation');
  };

  if (isGuarding) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#3b5bdb]" />
      </div>
    );
  }

  // État polling — en attente de confirmation Stripe
  if (polling) {
    return (
      <div className="min-h-screen bg-[#f5f5f7]">
        <OnboardingHeader step={2} totalSteps={5} />
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-65px)] px-6 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#3b5bdb] mb-6" />
          <h2 className="text-xl font-semibold text-[#111827] mb-2">
            {fr.onboardingV2.stripe.polling}
          </h2>
          <p className="text-[#6b7280]">{fr.onboardingV2.stripe.pollingDesc}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <OnboardingHeader step={2} totalSteps={5} />

      <div className="mx-auto max-w-5xl px-4 py-10 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Colonne gauche */}
          <div>
            <h1 className="text-3xl font-serif font-bold text-[#111827] mb-2">
              {fr.onboarding.stripe.title}
            </h1>
            <p className="text-[#6b7280] mb-5">{fr.onboarding.stripe.subtitle}</p>

            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full mb-8">
              <Lock className="h-3 w-3" />
              {fr.onboarding.stripe.securityBadge}
            </div>

            <ol className="space-y-5 mb-8">
              {[
                <span key="s1">
                  {fr.onboarding.stripe.step1}{' '}
                  <span className="text-[#6b7280]">→ dashboard.stripe.com</span>
                </span>,
                <span key="s2" className="flex items-center gap-3 flex-wrap">
                  {fr.onboarding.stripe.step2}
                  <a
                    href="https://dashboard.stripe.com/apikeys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#3b5bdb] text-sm hover:underline"
                  >
                    {fr.onboarding.stripe.step2Cta}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </span>,
                <span key="s3">{fr.onboarding.stripe.step3}</span>,
                <span key="s4">{fr.onboarding.stripe.step4}</span>,
                <span key="s5">
                  <span className="block mb-1">{fr.onboarding.stripe.step5}</span>
                  <ul className="ml-2 space-y-0.5 text-[#6b7280]">
                    <li>• {fr.onboarding.stripe.step5Perm1}</li>
                    <li>• {fr.onboarding.stripe.step5Perm2}</li>
                    <li>• {fr.onboarding.stripe.step5Perm3}</li>
                  </ul>
                </span>,
                <span key="s6">{fr.onboarding.stripe.step6}</span>,
              ].map((content, i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex-shrink-0 h-7 w-7 rounded-full bg-[#3b5bdb] text-white text-xs font-semibold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-sm text-[#111827] pt-1">{content}</span>
                </li>
              ))}
            </ol>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="apiKey">{fr.onboarding.stripe.keyLabel}</Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={e => { setApiKey(e.target.value); if (formatError) setFormatError(false); }}
                    placeholder="sk_live_... ou rk_live_..."
                    className="font-mono pr-10"
                    autoComplete="off"
                    aria-invalid={formatError || isError}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#111827]"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {formatError && (
                  <p className="text-xs text-[#ef4444]">{fr.onboarding.stripe.errorFormat}</p>
                )}
                {!formatError && isError && (
                  <p className="text-xs text-[#ef4444]">{fr.onboarding.stripe.errorInvalid}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-[#3b5bdb] hover:bg-[#3451c7] text-white"
                disabled={isPending || !apiKey.trim()}
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {fr.onboarding.stripe.ctaLoading}
                  </span>
                ) : fr.onboarding.stripe.cta}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handleSkip}
                disabled={updateStep.isPending}
                className="text-sm text-[#6b7280] hover:text-[#111827] underline underline-offset-2"
              >
                {fr.onboardingV2.stripe.skipLink}
              </button>
            </div>
          </div>

          {/* Colonne droite — permissions */}
          <div>
            <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6">
              <h2 className="text-base font-semibold text-[#111827] mb-4">
                {fr.onboarding.stripe.permTitle}
              </h2>
              <ul className="space-y-3 mb-6">
                {[
                  { label: 'Customers', required: true },
                  { label: 'Subscriptions', required: true },
                  { label: 'Invoices', required: true },
                  { label: 'Charges', required: false },
                  { label: 'PaymentIntents', required: false },
                  { label: 'Refunds', required: false },
                ].map(({ label, required }) => (
                  <li key={label} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      {required
                        ? <CheckCircle className="h-4 w-4 text-[#22c55e]" />
                        : <XCircle className="h-4 w-4 text-[#6b7280]" />}
                      <span className={required ? 'text-[#111827]' : 'text-[#6b7280]'}>{label}</span>
                    </span>
                    <span className={`text-xs ${required ? 'text-[#22c55e]' : 'text-[#6b7280]'}`}>
                      {required ? fr.onboarding.stripe.permReadOnly : fr.onboarding.stripe.permNotRequired}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-[#e5e7eb] pt-5">
                <p className="text-sm font-medium text-[#111827] mb-3">{fr.onboarding.stripe.neverTitle}</p>
                <ul className="space-y-2">
                  {[fr.onboarding.stripe.never1, fr.onboarding.stripe.never2, fr.onboarding.stripe.never3].map(text => (
                    <li key={text} className="flex items-center gap-2 text-sm text-[#6b7280]">
                      <XCircle className="h-4 w-4 text-[#ef4444] flex-shrink-0" />
                      {text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
