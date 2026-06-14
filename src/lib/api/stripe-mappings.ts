import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';
import type {
  StripeProductMapping,
  StripePrice,
  UpsertMappingPayload,
} from '@/lib/types/stripe-mappings';

interface MappingsListResponse {
  mappings: StripeProductMapping[];
  total: number;
}

interface MappingResponse {
  mapping: StripeProductMapping;
}

interface PricesResponse {
  prices: StripePrice[];
}

export async function getProductMappings(): Promise<StripeProductMapping[]> {
  const res = await fetchWithUserJwt<MappingsListResponse>('stripe-product-mappings-api');
  return res.mappings;
}

export async function upsertProductMapping(
  payload: UpsertMappingPayload,
): Promise<StripeProductMapping> {
  const res = await fetchWithUserJwt<MappingResponse>('stripe-product-mappings-api', {
    method: 'PUT',
    body: payload,
  });
  return res.mapping;
}

export async function getPricesFromStripe(): Promise<StripePrice[]> {
  const res = await fetchWithUserJwt<PricesResponse>(
    'stripe-product-mappings-api/prices-from-stripe',
  );
  return res.prices;
}
