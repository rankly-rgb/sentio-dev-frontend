import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';
import type {
  WebhookConfig,
  UpsertWebhookPayload,
  UpsertWebhookResponse,
  TestWebhookResponse,
  RegenerateSecretResponse,
} from '@/lib/types/webhook';

export async function getWebhookConfig(
  organizationId: string,
): Promise<WebhookConfig | null> {
  try {
    return await fetchWithUserJwt<WebhookConfig>(
      `webhook-config?organization_id=${encodeURIComponent(organizationId)}`,
    );
  } catch (err) {
    // 404 = not configured yet
    if (err instanceof Error && err.message.includes('404')) return null;
    throw err;
  }
}

export async function upsertWebhookConfig(
  organizationId: string,
  payload: UpsertWebhookPayload,
): Promise<UpsertWebhookResponse> {
  return fetchWithUserJwt<UpsertWebhookResponse>('webhook-config', {
    method: 'POST',
    body: { organization_id: organizationId, ...payload },
  });
}

export async function testWebhook(
  organizationId: string,
): Promise<TestWebhookResponse> {
  return fetchWithUserJwt<TestWebhookResponse>('webhook-config/test', {
    method: 'POST',
    body: { organization_id: organizationId },
  });
}

export async function regenerateWebhookSecret(
  organizationId: string,
): Promise<RegenerateSecretResponse> {
  return fetchWithUserJwt<RegenerateSecretResponse>('webhook-config/regenerate-secret', {
    method: 'POST',
    body: { organization_id: organizationId },
  });
}

export async function disableWebhook(
  organizationId: string,
): Promise<void> {
  await fetchWithUserJwt<unknown>('webhook-config/disable', {
    method: 'POST',
    body: { organization_id: organizationId },
  });
}
