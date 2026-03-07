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
): Promise<AuthorizeResponse> {
  return fetchWithUserJwt<AuthorizeResponse>(
    `integration-oauth/${provider}/authorize`,
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
