export type SubscriptionTierKey = 'free' | 'growth' | 'scale' | 'enterprise';

export interface SubscriptionTier {
  key: SubscriptionTierKey;
  display_name: string;
  price_cents_monthly: number | null;
  max_accounts: number | null;
  cta: 'self_serve' | 'contact_sales';
  stripe_price_id_env: string | null;
}

export interface SubscriptionStatus {
  current_tier: SubscriptionTierKey;
  accounts_count: number;
  max_accounts: number | null;
  is_over_limit: boolean;
  tiers: SubscriptionTier[];
}
