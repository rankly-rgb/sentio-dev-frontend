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
  | 'send_email_hubspot'
  | 'assign_owner'
  | 'update_tag'
  | 'log_note'
  | 'schedule_review'
  | 'flag_for_review'
  | 'send_email'
  | 'export_csv'
  | 'hubspot_enroll_sequence'
  | 'hubspot_update_company';

// V1 — actions disponibles
export type PlaybookActionType = 'send_email' | 'export_csv' | 'log_note' | 'flag_for_review';
/* V2 : 'slack_notify' | 'hubspot_enroll_sequence' | 'hubspot_update_company' | 'hubspot_create_task' */

export type PlaybookTemplateCategory =
  | 'churn_prevention'
  | 'expansion'
  | 'renewal'
  | 'payment_recovery'
  | 'reactivation';
/* V2 : | 'onboarding' | 'winback' | 'health_monitoring' | ... */

export interface PlaybookTemplate {
  id: string;
  title: string;
  description: string;
  playbook_type: PlaybookType;
  template_category: PlaybookTemplateCategory;
  priority: PlaybookPriority;
  is_automated: boolean;
  trigger_conditions: Record<string, unknown>;
  actions: PlaybookAction[];
}

const V1_ACTION_TYPES = new Set<string>(['send_email', 'export_csv', 'log_note', 'flag_for_review']);

export function isPlaybookActionType(type: string): type is PlaybookActionType {
  return V1_ACTION_TYPES.has(type);
}
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
  'account.mrr': '$2,490',
  'account.plan_tier': 'Growth',
  'account.seat_count': '25',
  'account.contract_end_date': 'Apr 15, 2026',
  'org.org_name': 'Sentio',
  'csm.csm_name': 'Alex Morgan',
  'csm.csm_email': 'alex@sentio.ai',
};

// --- Main Playbook interface ---
export interface Playbook {
  id: string;
  organization_id: string;
  // Locale-resolved by the backend — always use these for display
  display_name: string;
  display_description: string;
  title: string;
  title_en: string | null;
  description: string | null;
  description_en: string | null;
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
  current_eligible_count: number;
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
  title?: string;
  title_en?: string;
  description?: string;
  description_en?: string;
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
  title_en?: string;
  description?: string;
  description_en?: string;
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
  target_mode?: 'eligible';
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
  total_eligible?: number;
  has_more: boolean;
  message?: string;
  results: ExecutePlaybookResult[];
  actions_summary?: ExecutionActionDetail[];
  // Semi-automated response fields
  execution_id?: string;
  status?: 'pending_approval';
  accounts_count?: number;
}

// --- Completed action detail (from actions_completed JSONB) ---
export interface ExecutionCompletedAction {
  action_type: string;
  order: number;
  status: 'completed' | 'failed' | 'skipped';
  message: string;
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
  actions_completed: ExecutionCompletedAction[] | null;
  completed_steps: number | null;
  failed_steps: number | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// --- Full detail (get_playbook_full_detail RPC) ---
export interface PlaybookFullDetailPlaybook {
  id: string;
  name: string;
  description: string;
  status: PlaybookStatus;
  priority: PlaybookPriority;
  automation_type: PlaybookType;
  category: string;
  requires_approval: boolean;
  created_at: string;
}

export interface PlaybookFullDetailStats {
  targeted_count: number;
  eligible_count: number;
  reached_count: number;
  converted_count: number;
  mrr_recovered_cents: number;
  mrr_expansion_cents: number;
  executions_total: number;
  executions_completed: number;
  executions_failed: number;
  executions_in_progress: number;
}

export interface PlaybookAffectedAccountsSummary {
  total: number;
  mrr_at_risk_cents: number;
  by_urgency: {
    urgent: number;
    watch: number;
    stable: number;
  };
}

export interface PlaybookFullDetailCondition {
  field: string;
  operator: ConditionOperator;
  value: string | number | boolean | string[];
  label: string;
}

export interface PlaybookFullDetailAction {
  step: number;
  type: ActionType;
  label: string;
  detail?: string;
}

export interface PlaybookFullDetail {
  playbook: PlaybookFullDetailPlaybook;
  stats: PlaybookFullDetailStats;
  affected_accounts_summary: PlaybookAffectedAccountsSummary;
  conditions: PlaybookFullDetailCondition[];
  actions: PlaybookFullDetailAction[];
}

// --- Detail (get_playbook_detail RPC — v2) ---

export interface PlaybookDetailPlaybook {
  id: string;
  display_name: string;
  display_description: string;
  // Raw bilingual fields (needed for edit form)
  name: string;
  name_en: string | null;
  description: string;
  description_en: string | null;
  status: PlaybookStatus;
  category: string;
  is_automated: boolean;
  requires_approval: boolean;
  execution_type: string;
  created_at: string;
}

export interface PlaybookDetailEligibleAccounts {
  total: number;
  mrr_at_risk_cents: number;
  urgent_count: number;
  surveiller_count: number;
  stable_count: number;
}

export interface PlaybookDetailExecutionStats {
  total: number;
  completed: number;
  failed: number;
  in_progress: number;
  mrr_recovered_cents: number;
  mrr_expansion_cents: number;
  last_executed_at: string | null;
}

export interface PlaybookDetailAction {
  id: string;
  action_type: ActionType | string;
  label: string;
  config: Record<string, unknown>;
  is_active: boolean;
  sort_order: number;
}

export interface PlaybookDetail {
  playbook: PlaybookDetailPlaybook;
  eligible_accounts: PlaybookDetailEligibleAccounts;
  execution_stats: PlaybookDetailExecutionStats;
  actions: PlaybookDetailAction[];
}

export interface TransitionStatusResponse {
  success: boolean;
  new_status?: string;
  error?: string;
}

// --- Approve/reject execution (semi_automated) ---
export interface ApproveExecutionResponse {
  execution_id: string;
  status: 'running';
  accounts_count: number;
}

export interface RejectExecutionResponse {
  execution_id: string;
  status: 'cancelled';
}

// --- Fallback: build PlaybookFullDetail from legacy Playbook ---

function summarizeLegacyAction(type: ActionType, config: Record<string, unknown>): string {
  switch (type) {
    case 'slack_notify':
      return [config.channel, config.template].filter(Boolean).join(' — ');
    case 'create_task':
      return [config.title, config.due_days ? `${config.due_days}j` : ''].filter(Boolean).join(' — ');
    case 'assign_owner':
      return String(config.role ?? '');
    case 'update_tag':
      return String(config.tag ?? '');
    case 'log_note':
      return String(config.note ?? '');
    case 'schedule_review':
      return config.review_days ? `${config.review_days} days` : '';
    case 'flag_for_review':
      return '';
    case 'send_email_hubspot':
      return config.subject ? `HubSpot Email: "${String(config.subject)}"` : 'Email via HubSpot';
    case 'send_email':
      return config.subject ? `Email: "${String(config.subject)}"` : 'Email';
    default:
      return '';
  }
}

const FIELD_LABELS: Record<string, string> = {
  health_score: 'Health score',
  churn_risk_score: 'Churn risk score',
  expansion_score: 'Expansion score',
  product_usage_score: 'Product usage score',
  mrr_cents: 'MRR',
  arr_cents: 'ARR',
  plan_tier: 'Plan',
  seat_count: 'Seat count',
  seat_limit: 'Seat limit',
  contract_start_date: 'Contract start',
  contract_end_date: 'Contract end',
};

const OP_LABELS: Record<string, string> = {
  eq: 'equals', neq: 'not equal to',
  gt: 'greater than', gte: '≥',
  lt: 'less than', lte: '≤',
  in: 'in', not_in: 'not in',
};

const ACTION_LABELS: Record<string, string> = {
  slack_notify: 'Slack notification',
  create_task: 'Send HubSpot email sequence',
  assign_owner: 'Assign an owner',
  update_tag: 'Update tag',
  log_note: 'Add a note',
  schedule_review: 'Schedule a review',
  flag_for_review: 'Flag for review',
  send_email_hubspot: 'Email via HubSpot',
  send_email: 'Send an email',
};

export function buildFullDetailFromPlaybook(p: Playbook): PlaybookFullDetail {
  const criteria = p.eligibility_criteria ?? p.trigger_conditions;
  const conditions: PlaybookFullDetailCondition[] = (criteria?.conditions ?? []).map((c) => {
    const field = FIELD_LABELS[c.field] ?? c.field;
    const op = OP_LABELS[c.operator] ?? c.operator;
    const val = Array.isArray(c.value) ? c.value.join(', ') : String(c.value);
    return { field: c.field, operator: c.operator, value: c.value, label: `${field} ${op} ${val}` };
  });

  const actions: PlaybookFullDetailAction[] = [...(p.actions ?? [])]
    .sort((a, b) => a.order - b.order)
    .map((a, idx) => ({
      step: idx + 1,
      type: a.type,
      label: ACTION_LABELS[a.type] ?? a.type,
      detail: summarizeLegacyAction(a.type, a.config) || undefined,
    }));

  return {
    playbook: {
      id: p.id,
      name: p.title,
      description: p.description ?? '',
      status: p.status,
      priority: p.priority,
      automation_type: p.playbook_type,
      category: p.template_category ?? '',
      requires_approval: p.requires_approval,
      created_at: p.created_at,
    },
    stats: {
      targeted_count: p.accounts_targeted ?? 0,
      eligible_count: p.accounts_eligible ?? 0,
      reached_count: p.accounts_reached ?? 0,
      converted_count: p.accounts_converted ?? 0,
      mrr_recovered_cents: p.mrr_recovered_cents ?? 0,
      mrr_expansion_cents: p.mrr_expanded_cents ?? 0,
      executions_total: p.execution_stats?.total ?? 0,
      executions_completed: p.execution_stats?.completed ?? 0,
      executions_failed: p.execution_stats?.failed ?? 0,
      executions_in_progress: p.execution_stats?.running ?? 0,
    },
    affected_accounts_summary: {
      total: p.current_eligible_count ?? 0,
      mrr_at_risk_cents: 0,
      by_urgency: { urgent: 0, watch: 0, stable: 0 },
    },
    conditions,
    actions,
  };
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

// --- CSV export (chantier A) ---
export interface PlaybookExportAccount {
  id: string;
  display_name: string | null;
  mrr_cents: number | null;
  health_score: number | null;
  churn_risk_score: number | null;
}

export interface PlaybookExportPreview {
  accounts_count: number;
  mrr_at_risk_cents: number;
  accounts: PlaybookExportAccount[];
}

export type PlaybookRunStatus = 'exported' | 'executed';

export interface PlaybookRun {
  id: string;
  target_label: string | null;
  accounts_count: number;
  mrr_at_risk_cents: number;
  status: PlaybookRunStatus;
  exported_at: string;
  executed_at: string | null;
}

// --- Outcome tracking (chantier C — manual execution mark, attribution window,
// resolution rate, confirmation nudge) — per sentio-dev-backend API_CONTRACTS.md § "Playbook Outcome
// Tracking" 8.1-8.4 ---

export type AttributionStatusValue = 'not_executed' | 'active' | 'expired' | 'resolved';

export interface AttributionStatus {
  execution_id: string;
  executed_at: string | null;
  attribution_deadline_at: string | null;
  attribution_status: AttributionStatusValue;
  time_remaining_seconds: number | null;
}

// Shared response shape for both mark-executed (§8.1) and unmark-executed (§8.1.1)
export interface ExecutionMarkResult {
  execution_id: string;
  executed_at: string | null;
  attribution_deadline_at: string | null;
}

export interface PlaybookOutcomeStatsGroup {
  sample_size: number;
  resolved_count: number;
  resolution_rate: number | null;
  sample_size_warning: boolean;
}

export interface PlaybookOutcomeStats {
  playbook_id: string;
  executed: PlaybookOutcomeStatsGroup;
  not_executed: PlaybookOutcomeStatsGroup;
}

export type NudgeResponseValue = 'resolved' | 'not_resolved' | 'unsure';

export interface NudgeResponseResult {
  nudge_response: NudgeResponseValue | null;
  nudge_responded_at: string | null;
}
