import { Loader2 } from 'lucide-react';
import { useT } from '@/lib/i18n/useT';
import { useStripeOAuthInitiate } from '@/hooks/useOnboardingWizard';

export default function StripeOAuthButton() {
  const t = useT();
  const w = t.onboardingWizard.stripe;
  const initiate = useStripeOAuthInitiate();

  const handleClick = async () => {
    try {
      const { url } = await initiate.mutateAsync();
      window.location.href = url;
    } catch {
      // Error is shown via mutation state — no-op here
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-400 text-center">{w.oauthLabel}</p>
      <button
        type="button"
        onClick={handleClick}
        disabled={initiate.isPending}
        className="w-full border border-gray-300 text-gray-500 rounded-xl py-2.5 text-sm font-medium hover:border-indigo-400 hover:text-indigo-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {initiate.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {w.oauthCta}
      </button>
    </div>
  );
}
