export type PlaybookConnector =
  | 'brevo'
  | 'lemlist'
  | 'activecampaign'
  | 'mailchimp'
  | 'hubspot'
  | 'slack'
  | 'custom';

export type TriggerSegment =
  | 'champions'
  | 'en_expansion'
  | 'stables'
  | 'a_risque_leger'
  | 'en_danger_critique'
  | 'impayes'
  | 'en_churn'
  | 'nouveaux';

export interface PlaybookDestination {
  id: string;
  organization_id: string;
  name: string;
  connector: PlaybookConnector;
  is_active: boolean;
  require_approval: boolean;
  trigger_segments: TriggerSegment[];
  trigger_churn_threshold: number | null;
  trigger_on_invoice_past_due: boolean;
  api_key_vault_key: string | null;
  api_endpoint: string | null;
  template_id: string | null;
  message_template: string | null;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlaybookExecutionLog {
  id: string;
  destination_id: string;
  organization_id: string;
  account_id: string;
  trigger_reason: string;
  success: boolean;
  http_status: number | null;
  connector_response: string | null;
  executed_at: string;
}

export type CreatePlaybookDestinationPayload = Omit<
  PlaybookDestination,
  'id' | 'created_at' | 'updated_at' | 'last_triggered_at'
>;

export type UpdatePlaybookDestinationPayload = Partial<
  Pick<
    PlaybookDestination,
    | 'name'
    | 'connector'
    | 'is_active'
    | 'require_approval'
    | 'trigger_segments'
    | 'trigger_churn_threshold'
    | 'trigger_on_invoice_past_due'
    | 'api_key_vault_key'
    | 'api_endpoint'
    | 'template_id'
    | 'message_template'
  >
>;

export type ApprovalAction = 'approve' | 'reject';

export interface PlaybookApprovalQueueItem {
  id: string;
  organization_id: string;
  destination_id: string;
  account_id: string;
  stripe_customer_id: string;
  segment: TriggerSegment | string;
  churn_risk: number | null;
  mrr_eur: number | null;
  health_score: number | null;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  expires_at: string;
  comment: string | null;
  created_at: string;
  updated_at: string;
  // joined
  destination_name?: string;
  destination_connector?: PlaybookConnector;
}

export interface ApproveQueueItemPayload {
  queue_item_id: string;
  action: ApprovalAction;
  comment?: string;
}

export interface ApproveQueueItemResponse {
  success: boolean;
  queue_item_id: string;
  action: ApprovalAction;
}

export interface TestPlaybookDestinationResponse {
  success: boolean;
  http_status: number;
  response: string;
}
