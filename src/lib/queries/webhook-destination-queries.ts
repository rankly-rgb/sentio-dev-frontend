import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';
import type {
  OutboundWebhookDestination,
  CreateDestinationPayload,
  UpdateDestinationPayload,
  DestinationsListResponse,
  DestinationResponse,
  TestDestinationResponse,
  LogsResponse,
} from '@/lib/types/webhook-destinations';

export async function getDestinations(): Promise<OutboundWebhookDestination[]> {
  const res = await fetchWithUserJwt<DestinationsListResponse>('outbound-webhook-destinations');
  return res.destinations;
}

export async function createDestination(
  payload: CreateDestinationPayload,
): Promise<OutboundWebhookDestination> {
  const res = await fetchWithUserJwt<DestinationResponse>('outbound-webhook-destinations', {
    method: 'POST',
    body: payload,
  });
  return res.destination;
}

export async function updateDestination(
  id: string,
  payload: UpdateDestinationPayload,
): Promise<OutboundWebhookDestination> {
  const res = await fetchWithUserJwt<DestinationResponse>(
    `outbound-webhook-destinations/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: payload },
  );
  return res.destination;
}

export async function deleteDestination(id: string): Promise<void> {
  await fetchWithUserJwt<{ success: boolean }>(
    `outbound-webhook-destinations/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
  );
}

export async function testDestination(destinationId: string): Promise<TestDestinationResponse> {
  return fetchWithUserJwt<TestDestinationResponse>('outbound-webhook-test', {
    method: 'POST',
    body: { destination_id: destinationId },
  });
}

export async function getDestinationLogs(destinationId: string): Promise<LogsResponse['logs']> {
  const res = await fetchWithUserJwt<LogsResponse>(
    `outbound-webhook-logs?destination_id=${encodeURIComponent(destinationId)}&limit=20`,
  );
  return res.logs;
}
