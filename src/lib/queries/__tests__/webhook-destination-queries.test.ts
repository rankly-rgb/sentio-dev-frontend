import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getDestinations,
  createDestination,
  updateDestination,
  deleteDestination,
  testDestination,
  getDestinationLogs,
} from '../webhook-destination-queries';
import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';
import type {
  OutboundWebhookDestination,
  OutboundWebhookLog,
  CreateDestinationPayload,
} from '@/lib/types/webhook-destinations';

vi.mock('@/lib/fetchWithUserJwt', () => ({
  fetchWithUserJwt: vi.fn(),
}));

const mockFetch = vi.mocked(fetchWithUserJwt);

const destination: OutboundWebhookDestination = {
  id: 'dest-1',
  organization_id: 'org-1',
  name: 'CS Slack channel',
  destination_url: 'https://hooks.slack.com/services/xxx',
  provider: 'slack',
  is_active: true,
  trigger_segments: ['at_risk', 'critical'],
  trigger_churn_threshold: null,
  secret_header_name: null,
  secret_header_value: null,
  last_triggered_at: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

// webhook-destination-queries.ts was previously untested — this pass adds
// coverage for the URL/method/body it sends to fetchWithUserJwt and how it
// unwraps each response envelope (none of this is exercised elsewhere: the
// React Query hooks in useWebhookDestinations.ts mock this module wholesale
// rather than exercising the real request-building logic underneath it).
describe('webhook-destination-queries', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('getDestinations: GETs the list endpoint and unwraps { destinations }', async () => {
    mockFetch.mockResolvedValue({ destinations: [destination] });
    const result = await getDestinations();
    expect(mockFetch).toHaveBeenCalledWith('outbound-webhook-destinations');
    expect(result).toEqual([destination]);
  });

  it('createDestination: POSTs the payload and unwraps { destination }', async () => {
    mockFetch.mockResolvedValue({ destination });
    const payload: CreateDestinationPayload = {
      organization_id: 'org-1',
      provider: 'slack',
      name: 'CS Slack channel',
      destination_url: 'https://hooks.slack.com/services/xxx',
      is_active: true,
      trigger_segments: ['at_risk'],
      trigger_churn_threshold: null,
      secret_header_name: null,
      secret_header_value: null,
    };
    const result = await createDestination(payload);
    expect(mockFetch).toHaveBeenCalledWith('outbound-webhook-destinations', {
      method: 'POST',
      body: payload,
    });
    expect(result).toEqual(destination);
  });

  it('updateDestination: PATCHes the URL-encoded id with the payload', async () => {
    mockFetch.mockResolvedValue({ destination });
    const result = await updateDestination('dest 1/2', { is_active: false });
    expect(mockFetch).toHaveBeenCalledWith('outbound-webhook-destinations/dest%201%2F2', {
      method: 'PATCH',
      body: { is_active: false },
    });
    expect(result).toEqual(destination);
  });

  it('deleteDestination: DELETEs the URL-encoded id and returns nothing', async () => {
    mockFetch.mockResolvedValue({ success: true });
    const result = await deleteDestination('dest 1');
    expect(mockFetch).toHaveBeenCalledWith('outbound-webhook-destinations/dest%201', {
      method: 'DELETE',
    });
    expect(result).toBeUndefined();
  });

  it('testDestination: POSTs { destination_id } to the test endpoint', async () => {
    mockFetch.mockResolvedValue({ success: true, status: 200, response: 'ok' });
    const result = await testDestination('dest-1');
    expect(mockFetch).toHaveBeenCalledWith('outbound-webhook-test', {
      method: 'POST',
      body: { destination_id: 'dest-1' },
    });
    expect(result).toEqual({ success: true, status: 200, response: 'ok' });
  });

  it('getDestinationLogs: GETs the logs endpoint with the id URL-encoded and limit=20, unwraps { logs }', async () => {
    const logs: OutboundWebhookLog[] = [{
      id: 'log-1',
      destination_id: 'dest 1',
      account_id: 'acc-1',
      payload: {},
      response_status: 200,
      success: true,
      triggered_by: 'segment_change',
      created_at: '2026-01-01T00:00:00Z',
    }];
    mockFetch.mockResolvedValue({ logs });
    const result = await getDestinationLogs('dest 1');
    expect(mockFetch).toHaveBeenCalledWith('outbound-webhook-logs?destination_id=dest%201&limit=20');
    expect(result).toEqual(logs);
  });
});
