// --- OAuth Integration types ---
export type IntegrationProvider = 'stripe' | 'hubspot';
export type IntegrationStatus = 'active' | 'pending' | 'revoked' | 'expired';

export interface IntegrationSummary {
  provider: IntegrationProvider;
  connected: boolean;
  provider_account_id: string | null;
  scopes: string[];
  status: IntegrationStatus;
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
