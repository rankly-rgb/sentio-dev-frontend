import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Link2, ShieldCheck, Check, CheckCircle2, Loader2 } from 'lucide-react';
import { useT } from '@/lib/i18n/useT';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useHubspotConnect } from '@/hooks/useOnboardingWizard';

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

export default function StepConnectHubspot() {
  const t = useT();
  const w = t.onboardingWizard.hubspot;
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [apiError, setApiError] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const connect = useHubspotConnect();

  const validate = (value: string) => value.startsWith('pat-');

  const handleSubmit = async () => {
    setValidationError('');
    setApiError('');

    if (!validate(token)) {
      setValidationError(w.tokenError);
      return;
    }

    setSubmitState('loading');
    try {
      const result = await connect.mutateAsync(token);
      if (result.success) {
        setSubmitState('success');
        setTimeout(() => navigate('/dashboard', { replace: true }), 800);
      } else {
        setApiError(result.error ?? w.ctaLoading);
        setSubmitState('error');
      }
    } catch {
      setApiError(w.ctaLoading);
      setSubmitState('error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Optional badge */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">{w.title}</h2>
          <p className="mt-1 text-sm text-gray-500">{w.subtitle}</p>
        </div>
        <span className="flex-shrink-0 text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
          {w.optionalBadge}
        </span>
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
        <p className="font-medium text-gray-700 flex items-center gap-1.5">
          <Link2 className="h-4 w-4 text-indigo-500" />
          {w.instructionsTitle}
        </p>
        <ol className="space-y-1.5 text-gray-600 list-decimal list-inside">
          {[w.instrStep1, w.instrStep2, w.instrStep3, w.instrStep4].map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>

      {/* Token input */}
      <div className="space-y-1.5">
        <Label htmlFor="hubspot-token" className="text-sm font-medium text-gray-700">
          {w.tokenLabel}
        </Label>
        <div className="relative">
          <Input
            id="hubspot-token"
            type={showToken ? 'text' : 'password'}
            value={token}
            onChange={(e) => {
              setToken(e.target.value);
              setValidationError('');
              setApiError('');
              if (submitState === 'error') setSubmitState('idle');
            }}
            placeholder={w.tokenPlaceholder}
            className={cn(
              'pr-10',
              (validationError || apiError) && 'border-red-400 focus-visible:ring-red-400',
            )}
            aria-invalid={!!(validationError || apiError)}
          />
          <button
            type="button"
            onClick={() => setShowToken((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
        disabled={submitState === 'loading' || submitState === 'success' || !token}
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

      {/* Read-only data item */}
      <div className="flex items-start gap-2 text-sm text-gray-600">
        <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
        <span>
          <span className="font-medium text-gray-700">{w.dataTitle}</span>
          {' — '}
          {w.dataDesc}
        </span>
      </div>

      {/* Zero PII badge */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
        <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
        {w.zeroPiiBadge}
      </div>

      {/* Skip link */}
      <div className="text-center">
        <button
          type="button"
          onClick={() => navigate('/dashboard', { replace: true })}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          {w.skip}
        </button>
      </div>
    </div>
  );
}
