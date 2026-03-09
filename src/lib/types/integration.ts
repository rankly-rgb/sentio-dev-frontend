// --- OAuth Integration types ---
export type IntegrationProvider = 'stripe' | 'hubspot';
export type IntegrationStatus = 'active' | 'pending' | 'revoked' | 'expired';
export type IntegrationMethod = 'oauth' | 'api_key';

export interface IntegrationSummary {
  provider: IntegrationProvider;
  connected: boolean;
  provider_account_id: string | null;
  scopes: string[];
  status: IntegrationStatus;
  integration_method?: IntegrationMethod;
}

export interface IntegrationStatusResponse {
  stripe: IntegrationSummary;
  hubspot: IntegrationSummary;
}

export interface AuthorizeResponse {
  authorization_url: string;
}

export interface RevokeResponse {
  success: true;
}

export interface ConnectApiKeyResponse {
  success: true;
  account_id: string;
  account_name: string;
  integration_method: 'api_key';
  message: string;
}

// --- Stripe API key client-side validation ---

export function validateStripeKey(key: string): { valid: boolean; error?: string } {
  const trimmed = key.trim();
  if (!trimmed) return { valid: false, error: 'Clé API requise' };
  if (trimmed.startsWith('pk_')) {
    return { valid: false, error: 'Utilisez la Secret Key (sk_), pas la clé publique (pk_)' };
  }
  if (!/^(sk_live_|sk_test_|rk_live_|rk_test_)/.test(trimmed)) {
    return { valid: false, error: 'Format invalide — la clé doit commencer par sk_live_ ou sk_test_' };
  }
  if (trimmed.length < 30) {
    return { valid: false, error: 'Clé trop courte' };
  }
  return { valid: true };
}
