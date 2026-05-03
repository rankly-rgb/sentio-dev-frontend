import { supabase } from '@/lib/supabase';
import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';
import type {
  PlaybookDestination,
  CreatePlaybookDestinationPayload,
  UpdatePlaybookDestinationPayload,
  PlaybookExecutionLog,
  TestPlaybookDestinationResponse,
  PlaybookApprovalQueueItem,
  ApproveQueueItemPayload,
  ApproveQueueItemResponse,
} from '@/lib/types/playbook-destination';

export async function listPlaybookDestinations(): Promise<PlaybookDestination[]> {
  const { data, error } = await supabase
    .from('playbook_destinations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createPlaybookDestination(
  payload: CreatePlaybookDestinationPayload,
): Promise<PlaybookDestination> {
  const { data, error } = await supabase
    .from('playbook_destinations')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePlaybookDestination(
  id: string,
  payload: UpdatePlaybookDestinationPayload,
): Promise<PlaybookDestination> {
  const { data, error } = await supabase
    .from('playbook_destinations')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePlaybookDestination(id: string): Promise<void> {
  const { error } = await supabase
    .from('playbook_destinations')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function testPlaybookDestination(
  destinationId: string,
): Promise<TestPlaybookDestinationResponse> {
  return fetchWithUserJwt<TestPlaybookDestinationResponse>('playbook-test', {
    method: 'POST',
    body: { destination_id: destinationId },
  });
}

export async function listPlaybookExecutionLogs(
  destinationId: string,
  limit = 20,
): Promise<PlaybookExecutionLog[]> {
  const { data, error } = await supabase
    .from('playbook_execution_logs')
    .select('*')
    .eq('destination_id', destinationId)
    .order('executed_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function listPendingApprovals(): Promise<PlaybookApprovalQueueItem[]> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('playbook_approval_queue')
    .select('*, playbook_destinations(name, connector)')
    .eq('status', 'pending')
    .gt('expires_at', now)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const dest = row.playbook_destinations as
      | { name: string; connector: string }
      | null;
    const { playbook_destinations: _dest, ...rest } = row;
    return {
      ...rest,
      destination_name: dest?.name,
      destination_connector: dest?.connector,
    } as PlaybookApprovalQueueItem;
  });
}

export async function countPendingApprovals(): Promise<number> {
  const now = new Date().toISOString();
  const { count, error } = await supabase
    .from('playbook_approval_queue')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')
    .gt('expires_at', now);

  if (error) throw error;
  return count ?? 0;
}

export async function approveQueueItem(
  payload: ApproveQueueItemPayload,
): Promise<ApproveQueueItemResponse> {
  return fetchWithUserJwt<ApproveQueueItemResponse>('playbook-approve', {
    method: 'PATCH',
    body: payload,
  });
}
