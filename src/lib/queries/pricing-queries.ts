import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';
import type {
  PricingStatus,
  SubscribeToPlanPayload,
  SubscribeToPlanResult,
} from '@/lib/types/plan-tier';

export async function getPricingStatus(): Promise<PricingStatus> {
  return fetchWithUserJwt<PricingStatus>('pricing-status');
}

export async function subscribeToPlan(
  payload: SubscribeToPlanPayload,
): Promise<SubscribeToPlanResult> {
  return fetchWithUserJwt<SubscribeToPlanResult>('sentio-billing/subscribe', {
    method: 'POST',
    body: payload,
  });
}
