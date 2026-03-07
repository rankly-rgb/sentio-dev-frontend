// --- Union types ---
export type PlaybookStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';
export type PlaybookType = 'manual' | 'automated' | 'semi_automated' | 'template';
export type PlaybookPriority = 'low' | 'medium' | 'high' | 'critical';
export type TemplateCategory =
  | 'churn_prevention'
  | 'expansion'
  | 'onboarding'
  | 'reactivation'
  | 'renewal'
  | 'winback'
  | 'payment_recovery'
  | 'health_monitoring'
  | 'customer_education'
  | 'nps_detractors'
  | 'champions_advocacy'
  | 'downgrade_prevention'
  | 'success_planning';
export type ActionType =
  | 'slack_notify'
  | 'create_task'
  | 'assign_owner'
  | 'update_tag'
  | 'log_note'
  | 'schedule_review'
  | 'flag_for_review'
  | 'send_email';
export type ExecutionFrequency = 'daily' | 'weekly' | 'monthly';
export type ConditionOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in';
export type ConditionField =
  | 'health_score'
  | 'churn_risk_score'
  | 'expansion_score'
  | 'product_usage_score'
  | 'mrr_cents'
  | 'arr_cents'
  | 'plan_tier'
  | 'seat_count'
  | 'seat_limit'
  | 'contract_start_date'
  | 'contract_end_date';

// --- Nested structures ---
export interface PlaybookAction {
  type: ActionType;
  config: Record<string, unknown>;
  order: number;
}

export interface Condition {
  field: ConditionField | string;
  operator: ConditionOperator;
  value: string | number | boolean | string[];
}

export interface ConditionGroup {
  operator: 'AND' | 'OR';
  conditions: Condition[];
}

export interface ExecutionStats {
  total: number;
  completed: number;
  failed: number;
  running: number;
  pending: number;
  last_executed_at: string | null;
}

// --- Email config ---
export interface EmailConfig {
  recipient_field: string;
  subject: string;
  body_html: string;
  reply_to?: string;
}

// --- Workflow step ---
export interface WorkflowStep {
  step_order: number;
  delay_days: number;
  action_type: ActionType;
  title: string;
  config: Record<string, unknown>;
}

// --- Email template variables ---
export const EMAIL_VARIABLES = {
  account: ['account_name', 'health_score', 'mrr', 'plan_tier', 'seat_count', 'contract_end_date'],
  org: ['org_name'],
  csm: ['csm_name', 'csm_email'],
} as const;

export const EMAIL_PREVIEW_DATA: Record<string, string> = {
  'account.account_name': 'Acme Corp',
  'account.health_score': '42',
  'account.mrr': '2 490 €',
  'account.plan_tier': 'Growth',
  'account.seat_count': '25',
  'account.contract_end_date': '15/04/2026',
  'org.org_name': 'Sentio',
  'csm.csm_name': 'Marie Dupont',
  'csm.csm_email': 'marie@sentio.ai',
};

// --- Main Playbook interface ---
export interface Playbook {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  status: PlaybookStatus;
  playbook_type: PlaybookType;
  priority: PlaybookPriority;
  template_category: TemplateCategory | null;
  segment_id: string | null;
  is_template: boolean;
  is_automated: boolean;
  is_workflow: boolean;
  execution_frequency: ExecutionFrequency | null;
  requires_approval: boolean;
  trigger_conditions: ConditionGroup | null;
  eligibility_criteria: ConditionGroup | null;
  actions: PlaybookAction[];
  steps: WorkflowStep[];
  tags: string[];
  // KPI fields
  accounts_eligible: number;
  accounts_targeted: number;
  accounts_reached: number;
  accounts_converted: number;
  mrr_recovered_cents: number;
  mrr_expanded_cents: number;
  expected_impact: string | null;
  target_recovery_rate: number | null;
  // Execution stats (returned by GET ?id=X)
  execution_stats?: ExecutionStats;
  // Timestamps
  activated_at: string | null;
  deactivated_at: string | null;
  deactivation_reason: string | null;
  created_at: string;
  updated_at: string;
}

// --- API payloads ---
export interface CreatePlaybookPayload {
  organization_id: string;
  title: string;
  description?: string;
  playbook_type: PlaybookType;
  priority: PlaybookPriority;
  template_category?: TemplateCategory;
  segment_id?: string;
  is_automated?: boolean;
  is_workflow?: boolean;
  execution_frequency?: ExecutionFrequency;
  requires_approval?: boolean;
  actions?: PlaybookAction[];
  steps?: WorkflowStep[];
  eligibility_criteria?: ConditionGroup;
  trigger_conditions?: ConditionGroup;
}

export interface UpdatePlaybookPayload {
  title?: string;
  description?: string;
  status?: PlaybookStatus;
  playbook_type?: PlaybookType;
  priority?: PlaybookPriority;
  template_category?: TemplateCategory;
  segment_id?: string;
  is_automated?: boolean;
  is_workflow?: boolean;
  execution_frequency?: ExecutionFrequency;
  requires_approval?: boolean;
  actions?: PlaybookAction[];
  steps?: WorkflowStep[];
  eligibility_criteria?: ConditionGroup;
  trigger_conditions?: ConditionGroup;
}

export interface ExecutePlaybookPayload {
  playbook_id: string;
  organization_id: string;
  account_ids?: string[];
  segment_id?: string;
  execution_source: 'manual';
  cooldown_hours?: number;
}

export interface ExecutionActionDetail {
  type: 'webhook' | 'slack' | 'hubspot' | 'email';
  status: 'success' | 'failed' | 'skipped';
  message: string;
  latency_ms?: number;
  status_code?: number;
}

export interface ExecutePlaybookResult {
  execution_id: string;
  account_id: string;
  status: 'completed' | 'failed' | 'skipped';
  steps: number;
  completed: number;
  failed: number;
}

export interface ExecutePlaybookResponse {
  success: boolean;
  playbook_id: string;
  executions_created: number;
  has_more: boolean;
  results: ExecutePlaybookResult[];
  actions_summary?: ExecutionActionDetail[];
}

// --- Execution row (from playbook_executions table) ---
export interface PlaybookExecutionRow {
  id: string;
  playbook_id: string;
  account_id: string;
  organization_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  triggered_by: string | null;
  started_at: string | null;
  completed_at: string | null;
  result: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// --- Filter params for list view ---
export interface PlaybookFilters {
  status?: PlaybookStatus | 'all';
  playbook_type?: PlaybookType | 'all';
  template_category?: TemplateCategory | 'all';
  is_workflow?: boolean;
  page?: number;
  per_page?: number;
}

// --- List response (pagination) ---
export interface PlaybookListResponse {
  data: Playbook[];
  total: number;
  page: number;
  per_page: number;
}
