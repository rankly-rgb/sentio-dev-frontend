import { supabase } from '@/lib/supabase';

const PLAYBOOK_WRITABLE_COLUMNS = new Set([
  'title', 'description', 'status', 'trigger_conditions', 'eligibility_criteria',
  'is_automated', 'actions', 'activated_at', 'playbook_type', 'automation_trigger',
  'source', 'priority', 'execution_frequency', 'schedule_config', 'tags',
  'requires_approval', 'template_category', 'expected_impact', 'target_recovery_rate',
  'deactivated_at', 'deactivation_reason', 'updated_at',
]);

export async function updatePlaybook(
  playbookId: string,
  updates: Record<string, unknown>,
): Promise<{ success: boolean; error?: string }> {
  if (updates.status === 'active' && !updates.activated_at) {
    updates.activated_at = new Date().toISOString();
  }
  if (updates.status === 'archived') {
    if (!updates.deactivated_at) updates.deactivated_at = new Date().toISOString();
    if (!updates.deactivation_reason) updates.deactivation_reason = 'manually_archived';
  }

  updates.updated_at = new Date().toISOString();

  const safeUpdates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (PLAYBOOK_WRITABLE_COLUMNS.has(key)) {
      safeUpdates[key] = value;
    }
  }

  const { error } = await supabase
    .from('playbooks')
    .update(safeUpdates)
    .eq('id', playbookId);

  if (error) throw new Error(error.message);
  return { success: true };
}
