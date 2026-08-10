import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';

const LS_KEY = 'sentio_onboarding_state';

export default function StripeCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      // No OAuth code (e.g. browser back-button after the redirect, or a
      // malformed callback URL) — send the user back into the live wizard
      // flow (Promise re-derives the correct step from backend state), not
      // '/onboarding' (OnboardingWizard, a disconnected legacy single-page
      // implementation that never advanced past 2026-05 and shares no
      // state with this flow — a user landing there would restart from
      // scratch instead of resuming).
      navigate('/onboarding/promise', { replace: true });
      return;
    }

    const oauthState = searchParams.get('state') ?? undefined;
    fetchWithUserJwt<{ success: boolean }>('stripe-oauth-callback', {
      method: 'POST',
      body: { code, state: oauthState },
    })
      .then((result) => {
        if (result.success) {
          try {
            const raw = localStorage.getItem(LS_KEY);
            const parsed = raw ? JSON.parse(raw) : {};
            localStorage.setItem(
              LS_KEY,
              JSON.stringify({ ...parsed, currentStep: 2, stripeConnected: true, stripeMethod: 'oauth' }),
            );
          } catch {
            // ignore
          }
          navigate('/onboarding/promise', { replace: true });
        } else {
          navigate('/onboarding/promise', { replace: true });
        }
      })
      .catch(() => {
        navigate('/onboarding/promise', { replace: true });
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
    </div>
  );
}
