import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';
import type { SubscriptionStatus } from '@/lib/types/subscription';

export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  const res = await fetchWithUserJwt<{ data: SubscriptionStatus }>('subscription-status');
  return res.data;
}

export async function createBillingCheckout(tier: 'growth' | 'scale'): Promise<{ checkout_url: string }> {
  const res = await fetchWithUserJwt<{ data: { checkout_url: string } }>('stripe-billing-checkout', {
    method: 'POST',
    body: { tier },
  });
  return res.data;
}
