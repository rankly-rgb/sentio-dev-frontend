export type WebhookProvider = 'brevo' | 'mailchimp' | 'lemlist' | 'activecampaign' | 'slack' | 'custom';

export type SegmentKey =
  | 'champions'
  | 'expanding'
  | 'stable'
  | 'at_risk'
  | 'critical'
  | 'past_due'
  | 'churned'
  | 'new';

export type LogTrigger = 'segment_change' | 'churn_threshold' | 'manual';

export interface OutboundWebhookDestination {
  id: string;
  organization_id: string;
  name: string;
  destination_url: string;
  provider: WebhookProvider;
  is_active: boolean;
  trigger_segments: SegmentKey[];
  trigger_churn_threshold: number | null;
  secret_header_name: string | null;
  secret_header_value: string | null;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OutboundWebhookLog {
  id: string;
  destination_id: string;
  account_id: string;
  payload: Record<string, unknown>;
  response_status: number;
  success: boolean;
  triggered_by: LogTrigger;
  created_at: string;
}

export type CreateDestinationPayload = Omit<
  OutboundWebhookDestination,
  'id' | 'created_at' | 'updated_at' | 'last_triggered_at'
>;

export type UpdateDestinationPayload = Partial<
  Pick<
    OutboundWebhookDestination,
    | 'name'
    | 'destination_url'
    | 'provider'
    | 'is_active'
    | 'trigger_segments'
    | 'trigger_churn_threshold'
    | 'secret_header_name'
    | 'secret_header_value'
  >
>;

export interface DestinationsListResponse {
  destinations: OutboundWebhookDestination[];
}

export interface DestinationResponse {
  destination: OutboundWebhookDestination;
}

export interface TestDestinationResponse {
  success: boolean;
  status: number;
  response: string;
}

export interface LogsResponse {
  logs: OutboundWebhookLog[];
}
