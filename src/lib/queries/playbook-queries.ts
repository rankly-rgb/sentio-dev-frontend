import { supabase } from '@/lib/supabase';
import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';
import type {
  Playbook,
  PlaybookTemplate,
  PlaybookFilters,
  PlaybookListResponse,
  CreatePlaybookPayload,
  UpdatePlaybookPayload,
  ExecutePlaybookPayload,
  ExecutePlaybookResponse,
  PlaybookExecutionRow,
  PlaybookFullDetail,
  PlaybookDetail,
  PlaybookDetailAction,
  TransitionStatusResponse,
  ApproveExecutionResponse,
  RejectExecutionResponse,
  PlaybookExportPreview,
  PlaybookRun,
} from '@/lib/types/playbook';

// --- CRUD ---

export async function listPlaybooks(
  organizationId: string,
  filters: PlaybookFilters = {},
): Promise<PlaybookListResponse> {
  const params = new URLSearchParams();
  params.set('organization_id', organizationId);
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.playbook_type && filters.playbook_type !== 'all') params.set('playbook_type', filters.playbook_type);
  if (filters.template_category && filters.template_category !== 'all') params.set('template_category', filters.template_category);
  if (filters.is_workflow !== undefined) params.set('is_workflow', String(filters.is_workflow));
  if (filters.page) params.set('page', String(filters.page));
  if (filters.per_page) params.set('per_page', String(filters.per_page));

  return fetchWithUserJwt<PlaybookListResponse>(`playbook-crud?${params.toString()}`);
}

export async function listPlaybookTemplates(
  organizationId: string,
): Promise<PlaybookListResponse> {
  return fetchWithUserJwt<PlaybookListResponse>(
    `playbook-crud?organization_id=${organizationId}&is_template=true&per_page=50`,
  );
}

interface PlaybookTemplatesV1Response {
  data: {
    templates: PlaybookTemplate[];
    locale: string;
    total: number;
  };
}

export async function listPlaybookTemplatesV1(): Promise<PlaybookTemplate[]> {
  const res = await fetchWithUserJwt<PlaybookTemplatesV1Response>('playbook-templates');
  return res.data.templates;
}

export interface CreateFromTemplatePayload {
  from_template_id: string;
  title?: string;
}

export interface CreateFromTemplateResponse {
  id: string;
  title: string;
  status: string;
  actions: Playbook['actions'];
  organization_id: string;
}

export async function createPlaybookFromTemplate(
  payload: CreateFromTemplatePayload,
): Promise<CreateFromTemplateResponse> {
  return fetchWithUserJwt<CreateFromTemplateResponse>('playbook-crud', {
    method: 'POST',
    body: payload,
  });
}

export async function getPlaybook(id: string): Promise<Playbook> {
  return fetchWithUserJwt<Playbook>(`playbook-crud?id=${id}`);
}

export async function createPlaybook(payload: CreatePlaybookPayload): Promise<Playbook> {
  return fetchWithUserJwt<Playbook>('playbook-crud', {
    method: 'POST',
    body: payload,
  });
}

export async function updatePlaybookViaApi(
  id: string,
  payload: UpdatePlaybookPayload,
): Promise<Playbook> {
  return fetchWithUserJwt<Playbook>(`playbook-crud?id=${id}`, {
    method: 'PUT',
    body: payload,
  });
}

export async function archivePlaybook(id: string): Promise<void> {
  await fetchWithUserJwt<unknown>(`playbook-crud?id=${id}`, { method: 'DELETE' });
}

// --- Execution ---

export async function executePlaybook(
  payload: ExecutePlaybookPayload,
): Promise<ExecutePlaybookResponse> {
  return fetchWithUserJwt<ExecutePlaybookResponse>('playbook-execute', {
    method: 'POST',
    body: payload,
  });
}

// --- Execution history (direct Supabase query) ---

export async function listPlaybookExecutions(
  playbookId: string,
  limit = 20,
): Promise<PlaybookExecutionRow[]> {
  const { data, error } = await supabase
    .from('playbook_executions')
    .select('*')
    .eq('playbook_id', playbookId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// --- Full detail (consolidated RPC) ---

export async function getPlaybookFullDetail(
  playbookId: string,
): Promise<PlaybookFullDetail> {
  const { data, error } = await supabase.rpc('get_playbook_full_detail', {
    p_playbook_id: playbookId,
  });
  if (error) throw error;
  return data as PlaybookFullDetail;
}

// --- Detail v2 (get_playbook_detail RPC) ---

// Raw action shape from the RPC — field names may vary
interface RawPlaybookAction {
  id?: string;
  action_id?: string;
  action_type?: string;
  type?: string;
  label?: string;
  config?: Record<string, unknown>;
  is_active?: boolean;
  active?: boolean;
  sort_order?: number;
  order?: number;
  step?: number;
}

// Action types that are fully implemented on the backend
const IMPLEMENTED_ACTIONS: ReadonlySet<string> = new Set([
  'slack_notify',
  'create_task',
  'send_email_hubspot',
  'flag_for_review',
  'log_note',
  'hubspot_enroll_sequence',
  'hubspot_update_company',
]);

function normalizeAction(raw: RawPlaybookAction): PlaybookDetailAction {
  const actionType = raw.action_type ?? raw.type ?? '';
  // Use DB is_active when present, otherwise derive from known implemented types
  const hasActiveField = raw.is_active !== undefined || raw.active !== undefined;
  const isActive = hasActiveField
    ? (raw.is_active ?? raw.active ?? false)
    : IMPLEMENTED_ACTIONS.has(actionType);

  return {
    id: raw.id ?? raw.action_id ?? '',
    action_type: actionType,
    label: raw.label ?? '',
    config: raw.config ?? {},
    is_active: isActive,
    sort_order: raw.sort_order ?? raw.order ?? raw.step ?? 0,
  };
}

export async function getPlaybookDetail(
  playbookId: string,
): Promise<PlaybookDetail> {
  const { data, error } = await supabase.rpc('get_playbook_detail', {
    p_playbook_id: playbookId,
  });
  if (error) throw error;
  const raw = data as PlaybookDetail & { actions: RawPlaybookAction[] };
  return {
    ...raw,
    actions: Array.isArray(raw.actions) ? raw.actions.map(normalizeAction) : [],
  };
}

// --- Status transition ---

export async function transitionPlaybookStatus(
  playbookId: string,
  targetStatus: 'active' | 'draft' | 'archived',
): Promise<TransitionStatusResponse> {
  const { data, error } = await supabase.rpc('transition_playbook_status', {
    p_playbook_id: playbookId,
    p_target_status: targetStatus,
  });
  if (error) throw error;
  return data as TransitionStatusResponse;
}

// --- Approve/reject execution (semi_automated) ---

export async function approveExecution(
  playbookId: string,
  executionId: string,
): Promise<ApproveExecutionResponse> {
  return fetchWithUserJwt<ApproveExecutionResponse>(
    `playbook-crud/${playbookId}/approve-execution`,
    { method: 'POST', body: { execution_id: executionId } },
  );
}

export async function rejectExecution(
  playbookId: string,
  executionId: string,
  reason?: string,
): Promise<RejectExecutionResponse> {
  return fetchWithUserJwt<RejectExecutionResponse>(
    `playbook-crud/${playbookId}/reject-execution`,
    { method: 'POST', body: { execution_id: executionId, reason } },
  );
}

// --- CSV export (chantier A) ---

export async function previewPlaybookExport(playbookId: string): Promise<PlaybookExportPreview> {
  const res = await fetchWithUserJwt<{ data: PlaybookExportPreview }>('export-playbook-csv', {
    method: 'POST',
    body: { playbook_id: playbookId, preview: true },
  });
  return res.data;
}

export async function listPlaybookRuns(playbookId: string): Promise<PlaybookRun[]> {
  const res = await fetchWithUserJwt<{ data: { runs: PlaybookRun[] } }>(
    `export-playbook-csv?playbook_id=${playbookId}`,
  );
  return res.data.runs;
}

export async function markPlaybookRunExecuted(runId: string): Promise<{ success: boolean; updated: boolean }> {
  return fetchWithUserJwt<{ success: boolean; updated: boolean }>('export-playbook-csv', {
    method: 'PATCH',
    body: { run_id: runId },
  });
}
