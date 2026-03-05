import { supabase } from '@/lib/supabase';
import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';
import type {
  Playbook,
  PlaybookFilters,
  PlaybookListResponse,
  CreatePlaybookPayload,
  UpdatePlaybookPayload,
  ExecutePlaybookPayload,
  ExecutePlaybookResponse,
  PlaybookExecutionRow,
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
