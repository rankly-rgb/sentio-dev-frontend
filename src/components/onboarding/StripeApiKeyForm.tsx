import { useState } from 'react';
import { Eye, EyeOff, Key, Loader2, CheckCircle2 } from 'lucide-react';
import { useT } from '@/lib/i18n/useT';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useVerifyStripeToken } from '@/hooks/useOnboardingWizard';

const VALID_PREFIXES = ['rk_live_', 'rk_test_', 'sk_live_', 'sk_test_'];

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

interface Props {
  onSuccess: (method: 'api_key') => void;
}

export default function StripeApiKeyForm({ onSuccess }: Props) {
  const t = useT();
  const w = t.onboardingWizard.stripe;
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [apiError, setApiError] = useState('');
  const verify = useVerifyStripeToken();

  const validate = (value: string) =>
    VALID_PREFIXES.some((p) => value.startsWith(p));

  const handleSubmit = async () => {
    setValidationError('');
    setApiError('');

    if (!validate(apiKey)) {
      setValidationError(w.keyError);
      return;
    }

    setSubmitState('loading');
    try {
      const result = await verify.mutateAsync(apiKey);
      if (result.success) {
        setSubmitState('success');
        setTimeout(() => onSuccess('api_key'), 800);
      } else {
        setApiError(result.error ?? w.ctaError);
        setSubmitState('error');
      }
    } catch {
      setApiError(w.ctaError);
      setSubmitState('error');
    }
  };

  return (
    <div className="space-y-5">
      {/* Instructions inline */}
      <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
        <p className="font-medium text-gray-700 flex items-center gap-1.5">
          <Key className="h-4 w-4 text-indigo-500" />
          {w.instructionsTitle}
        </p>
        <ol className="space-y-1.5 text-gray-600 list-decimal list-inside">
          {[w.instrStep1, w.instrStep2, w.instrStep3, w.instrStep4].map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>

      {/* Key input */}
      <div className="space-y-1.5">
        <Label htmlFor="stripe-key" className="text-sm font-medium text-gray-700">
          {w.keyLabel}
        </Label>
        <div className="relative">
          <Input
            id="stripe-key"
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setValidationError('');
              setApiError('');
              if (submitState === 'error') setSubmitState('idle');
            }}
            placeholder={w.keyPlaceholder}
            className={cn(
              'pr-10',
              (validationError || apiError) && 'border-red-400 focus-visible:ring-red-400',
            )}
            aria-invalid={!!(validationError || apiError)}
          />
          <button
            type="button"
            onClick={() => setShowKey((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {(validationError || apiError) && (
          <p className="text-xs text-red-500">{validationError || apiError}</p>
        )}
      </div>

      {/* CTA */}
      <Button
        type="button"
        onClick={handleSubmit}
        disabled={submitState === 'loading' || submitState === 'success' || !apiKey}
        className={cn(
          'w-full rounded-xl py-3 font-semibold text-white transition-colors',
          submitState === 'success'
            ? 'bg-green-600 hover:bg-green-600'
            : 'bg-indigo-600 hover:bg-indigo-700',
        )}
      >
        {submitState === 'loading' && (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {w.ctaLoading}
          </span>
        )}
        {submitState === 'success' && (
          <span className="flex items-center justify-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {w.ctaSuccess}
          </span>
        )}
        {(submitState === 'idle' || submitState === 'error') && w.cta}
      </Button>
    </div>
  );
}
