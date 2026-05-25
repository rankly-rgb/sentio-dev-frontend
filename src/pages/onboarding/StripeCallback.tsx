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
      navigate('/onboarding', { replace: true });
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
