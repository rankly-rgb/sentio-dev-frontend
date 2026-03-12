import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';
import type {
  IntegrationProvider,
  IntegrationStatusResponse,
  AuthorizeResponse,
  RevokeResponse,
  ConnectApiKeyResponse,
  ConnectHubspotApiKeyResponse,
  ConnectSlackBotTokenResponse,
} from '@/lib/types/integration';

export async function getIntegrationStatus(): Promise<IntegrationStatusResponse> {
  return fetchWithUserJwt<IntegrationStatusResponse>('integration-oauth/status');
}

export async function getAuthorizeUrl(
  provider: IntegrationProvider,
  redirectAfter?: string,
): Promise<AuthorizeResponse> {
  const params = redirectAfter
    ? `?redirect_after=${encodeURIComponent(redirectAfter)}`
    : '';
  return fetchWithUserJwt<AuthorizeResponse>(
    `integration-oauth/${provider}/authorize${params}`,
  );
}

export async function revokeIntegration(
  provider: IntegrationProvider,
): Promise<RevokeResponse> {
  return fetchWithUserJwt<RevokeResponse>('integration-oauth/revoke', {
    method: 'POST',
    body: { provider },
  });
}

export async function connectStripeApiKey(
  stripeApiKey: string,
): Promise<ConnectApiKeyResponse> {
  return fetchWithUserJwt<ConnectApiKeyResponse>(
    'integration-oauth/stripe/api-key',
    {
      method: 'POST',
      body: { stripe_api_key: stripeApiKey },
    },
  );
}

export async function connectHubspotApiKey(
  apiKey: string,
): Promise<ConnectHubspotApiKeyResponse> {
  return fetchWithUserJwt<ConnectHubspotApiKeyResponse>(
    'integration-oauth/hubspot/api-key',
    {
      method: 'POST',
      body: { api_key: apiKey },
    },
  );
}

export async function connectSlackBotToken(
  botToken: string,
): Promise<ConnectSlackBotTokenResponse> {
  return fetchWithUserJwt<ConnectSlackBotTokenResponse>(
    'integration-oauth/slack/bot-token',
    {
      method: 'POST',
      body: { bot_token: botToken },
    },
  );
}
