// --- Webhook event types ---
export type WebhookEventType =
  | 'churn_risk_critical'
  | 'payment_failed'
  | 'renewal_upcoming'
  | 'expansion_opportunity'
  | 'score_drop'
  | 'onboarding_stalled';

export const WEBHOOK_EVENT_TYPES: WebhookEventType[] = [
  'churn_risk_critical',
  'payment_failed',
  'renewal_upcoming',
  'expansion_opportunity',
  'score_drop',
  'onboarding_stalled',
];

// --- Webhook config from API ---
export interface WebhookConfig {
  id: string;
  organization_id: string;
  endpoint_url: string;
  is_active: boolean;
  active_events: WebhookEventType[];
  secret_prefix: string; // e.g. "sk_whk_a1b2c3d4..."
  failure_count: number;
  last_triggered_at: string | null;
  last_status_code: number | null;
  last_error_message: string | null;
  created_at: string;
  updated_at: string;
}

// --- API payloads ---
export interface UpsertWebhookPayload {
  endpoint_url: string;
  active_events: WebhookEventType[];
}

export interface UpsertWebhookResponse {
  config: WebhookConfig;
  secret?: string; // Only returned on first creation
}

export interface TestWebhookResponse {
  success: boolean;
  status_code?: number;
  latency_ms?: number;
  error?: string;
}

export interface RegenerateSecretResponse {
  new_secret: string;
  secret_prefix: string;
}

// --- Execution action result (for playbook execution display) ---
export type WebhookActionStatus = 'success' | 'failed' | 'skipped';

export interface PlaybookExecutionAction {
  type: 'webhook' | 'slack' | 'hubspot' | 'email';
  status: WebhookActionStatus;
  message: string;
  latency_ms?: number;
  status_code?: number;
}
