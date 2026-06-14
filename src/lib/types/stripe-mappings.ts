export type PlanTier = 'starter' | 'growth' | 'enterprise';

export interface StripeProductMapping {
  id: string;
  organization_id: string;
  stripe_price_id: string;
  stripe_product_name: string | null;
  stripe_price_label: string | null;
  plan_tier: PlanTier | null;
  seat_limit: number | null;
  unlimited_seats: boolean;
  in_use?: boolean;
  created_at: string;
  updated_at: string;
}

export interface StripePrice {
  stripe_price_id: string;
  stripe_product_name: string;
  stripe_price_label: string;
  currency: string;
  unit_amount: number;
  recurring_interval: 'month' | 'year';
  already_mapped: boolean;
}

export interface UpsertMappingPayload {
  stripe_price_id: string;
  plan_tier: PlanTier | null;
  seat_limit: number | null;
  unlimited_seats: boolean;
  stripe_product_name?: string;
  stripe_price_label?: string;
}
