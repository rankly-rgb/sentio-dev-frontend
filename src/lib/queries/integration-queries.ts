import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';
import type {
  IntegrationProvider,
  IntegrationStatusResponse,
  AuthorizeResponse,
  RevokeResponse,
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
