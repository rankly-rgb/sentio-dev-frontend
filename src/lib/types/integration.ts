// --- OAuth Integration types ---
export type IntegrationProvider = 'stripe' | 'hubspot' | 'slack';
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
  slack: IntegrationSummary;
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

export interface ConnectHubspotApiKeyResponse {
  success: true;
  provider: 'hubspot';
  method: 'api_key';
  portal_id: string;
  status: 'connected';
}

export interface ConnectSlackBotTokenResponse {
  success: true;
  provider: 'slack';
  method: 'bot_token';
  team_id: string;
  team_name: string;
  status: 'connected';
}

// --- Stripe API key client-side validation ---

export function validateStripeKey(key: string): { valid: boolean; error?: string } {
  const trimmed = key.trim();
  if (!trimmed) return { valid: false, error: 'API key required' };
  if (trimmed.startsWith('pk_')) {
    return { valid: false, error: 'Use the Secret Key (sk_), not the publishable key (pk_)' };
  }
  if (!/^(sk_live_|sk_test_|rk_live_|rk_test_)/.test(trimmed)) {
    return { valid: false, error: 'Invalid format — the key must start with sk_live_ or sk_test_' };
  }
  if (trimmed.length < 30) {
    return { valid: false, error: 'Key too short' };
  }
  return { valid: true };
}

// --- HubSpot API key client-side validation ---

export function validateHubspotKey(key: string): { valid: boolean; error?: string } {
  const trimmed = key.trim();
  if (!trimmed) return { valid: false, error: 'API key required' };
  if (!trimmed.startsWith('pat-')) {
    return { valid: false, error: 'Invalid format — the key must start with pat-' };
  }
  if (trimmed.length < 30) {
    return { valid: false, error: 'Key too short' };
  }
  return { valid: true };
}

// --- Slack Bot Token client-side validation ---

export function validateSlackBotToken(token: string): { valid: boolean; error?: string } {
  const trimmed = token.trim();
  if (!trimmed) return { valid: false, error: 'Token required' };
  if (!trimmed.startsWith('xoxb-') && !trimmed.startsWith('xoxp-')) {
    return { valid: false, error: 'The token must start with xoxb- (Bot Token)' };
  }
  if (trimmed.length < 30) {
    return { valid: false, error: 'Token too short' };
  }
  return { valid: true };
}
