import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';

export interface UpdateStripeConnectionResponse {
  success: true;
  mode: 'live' | 'test';
  account_id: string | null;
}

export interface DisconnectStripeConnectionResponse {
  success: true;
}

export async function updateStripeConnection(stripeApiKey: string): Promise<UpdateStripeConnectionResponse> {
  return fetchWithUserJwt<UpdateStripeConnectionResponse>('update-stripe-connection', {
    method: 'POST',
    body: { action: 'update', stripe_api_key: stripeApiKey },
  });
}

export async function disconnectStripeConnection(): Promise<DisconnectStripeConnectionResponse> {
  return fetchWithUserJwt<DisconnectStripeConnectionResponse>('update-stripe-connection', {
    method: 'POST',
    body: { action: 'disconnect' },
  });
}
