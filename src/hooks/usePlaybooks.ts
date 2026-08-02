import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  listPlaybooks,
  listPlaybookTemplates,
  listPlaybookTemplatesV1,
  createPlaybookFromTemplate,
  getPlaybook,
  createPlaybook,
  updatePlaybookViaApi,
  archivePlaybook,
  executePlaybook,
  listPlaybookExecutions,
  getPlaybookFullDetail,
  getPlaybookDetail,
  transitionPlaybookStatus,
  approveExecution,
  rejectExecution,
  previewPlaybookExport,
  listPlaybookRuns,
  markPlaybookRunExecuted,
} from '@/lib/queries/playbook-queries';
import { exportPlaybookCsv } from '@/lib/exportCsv';
import type {
  PlaybookFilters,
  PlaybookStatus,
  CreatePlaybookPayload,
  UpdatePlaybookPayload,
  ExecutePlaybookPayload,
} from '@/lib/types/playbook';

const KEYS = {
  all: ['playbooks'] as const,
  list: (orgId: string, filters: PlaybookFilters) => ['playbooks', 'list', orgId, filters] as const,
  templates: (orgId: string) => ['playbooks', 'templates', orgId] as const,
  detail: (id: string) => ['playbooks', 'detail', id] as const,
  executions: (id: string) => ['playbooks', 'executions', id] as const,
  exportPreview: (id: string) => ['playbooks', 'export-preview', id] as const,
  runs: (id: string) => ['playbooks', 'runs', id] as const,
};

export function usePlaybooks(filters: PlaybookFilters = {}) {
  const { user } = useAuth();
  return useQuery({
    queryKey: KEYS.list(user?.organization_id ?? '', filters),
    queryFn: () => listPlaybooks(user?.organization_id ?? '', filters),
    enabled: !!user?.organization_id,
    staleTime: 60_000,
  });
}

export function useWorkflows(filters: PlaybookFilters = {}) {
  return usePlaybooks({ ...filters, is_workflow: true });
}

export function usePlaybookTemplates() {
  const { user } = useAuth();
  return useQuery({
    queryKey: KEYS.templates(user?.organization_id ?? ''),
    queryFn: () => listPlaybookTemplates(user?.organization_id ?? ''),
    enabled: !!user?.organization_id,
    staleTime: 120_000,
  });
}

export function usePlaybookTemplatesV1(locale: 'fr' | 'en' = 'en') {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['playbooks', 'templates-v1', user?.organization_id ?? '', locale],
    queryFn: () => listPlaybookTemplatesV1(locale),
    enabled: !!user?.organization_id,
    staleTime: 120_000,
  });
}

export function useCreatePlaybookFromTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { templateId: string; title?: string }) =>
      createPlaybookFromTemplate({ from_template_id: payload.templateId, title: payload.title }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['playbooks', 'list'] });
    },
    retry: false,
    onError: () => {},
  });
}

export function usePlaybook(id: string | undefined) {
  return useQuery({
    queryKey: KEYS.detail(id ?? ''),
    queryFn: () => getPlaybook(id ?? ''),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function usePlaybookExecutions(playbookId: string | undefined) {
  return useQuery({
    queryKey: KEYS.executions(playbookId ?? ''),
    queryFn: () => listPlaybookExecutions(playbookId ?? ''),
    enabled: !!playbookId,
    staleTime: 30_000,
  });
}

export function useCreatePlaybook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePlaybookPayload) => createPlaybook(payload),
    onSuccess: () => {
      // Invalidate lists only, not existing details/executions
      qc.invalidateQueries({ queryKey: ['playbooks', 'list'] });
      qc.invalidateQueries({ queryKey: ['playbooks', 'templates'] });
      toast.success('Playbook created successfully');
    },
    onError: (e: Error) => {
      toast.error('Error creating playbook: ' + e.message);
    },
  });
}

export function useUpdatePlaybook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePlaybookPayload }) =>
      updatePlaybookViaApi(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['playbooks', 'list'] });
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
      toast.success('Playbook updated');
    },
    onError: (e: Error) => {
      toast.error('Update error: ' + e.message);
    },
  });
}

export function useArchivePlaybook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archivePlaybook(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['playbooks', 'list'] });
      toast.success('Playbook archived');
    },
    onError: (e: Error) => {
      toast.error('Archiving error: ' + e.message);
    },
  });
}

export function useExecutePlaybook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ExecutePlaybookPayload) => executePlaybook(payload),
    onSuccess: (data, { playbook_id }) => {
      qc.invalidateQueries({ queryKey: KEYS.executions(playbook_id) });
      // Invalidate both detail key shapes (legacy + v2)
      qc.invalidateQueries({ queryKey: KEYS.detail(playbook_id) });
      qc.invalidateQueries({ queryKey: ['playbooks', 'detail-v2', playbook_id] });

      // Semi-automated → pending approval
      if (data.status === 'pending_approval') {
        toast.info(`Execution pending approval — ${data.accounts_count ?? 0} accounts`);
        return;
      }

      if (data.executions_created > 0) {
        // Build enriched summary
        const results = data.results ?? [];
        const completed = results.filter(r => r.status === 'completed').length;
        const failed = results.filter(r => r.status === 'failed').length;
        const skipped = results.filter(r => r.status === 'skipped').length;

        let msg = data.has_more
          ? `${data.executions_created} accounts processed (${data.total_eligible ?? '?'} eligible in total — max 200 per run)`
          : `${data.executions_created} accounts processed`;
        if (completed > 0 || failed > 0 || skipped > 0) {
          const parts: string[] = [];
          if (completed > 0) parts.push(`${completed} succeeded`);
          if (failed > 0) parts.push(`${failed} failed`);
          if (skipped > 0) parts.push(`${skipped} skipped`);
          msg += ` — ${parts.join(', ')}`;
        }
        toast.success(msg);

        // Warn about skipped actions
        const hasSkipped = data.actions_summary?.some(a => a.status === 'skipped');
        if (hasSkipped) {
          toast.warning('Some actions were skipped. Check your integration configuration.', {
            duration: 8000,
          });
        }
      } else {
        // 0 executions — display backend message with English translation
        const MESSAGE_MAP: Record<string, string> = {
          'All eligible accounts have recent executions':
            'All eligible accounts have already been processed in the last 24h. Try again later.',
          'No accounts match eligibility criteria':
            'No account matches the playbook eligibility criteria.',
          'No accounts found':
            'No accounts found in the organization.',
          'No eligible accounts':
            'No eligible accounts in the target segment.',
        };
        const displayMsg = MESSAGE_MAP[data.message ?? ''] ?? data.message ?? 'No eligible accounts';
        toast.warning(displayMsg);
      }
    },
    onError: (e: Error) => {
      toast.error('Execution error: ' + e.message);
    },
  });
}

export function usePlaybookFullDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['playbooks', 'full-detail', id ?? ''],
    queryFn: () => getPlaybookFullDetail(id ?? ''),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function usePlaybookDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['playbooks', 'detail-v2', id ?? ''],
    queryFn: () => getPlaybookDetail(id ?? ''),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useTransitionPlaybookStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, targetStatus }: { id: string; targetStatus: PlaybookStatus }) =>
      transitionPlaybookStatus(id, targetStatus as 'active' | 'draft' | 'archived'),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['playbooks'] });
      qc.invalidateQueries({ queryKey: ['playbooks', 'full-detail', id] });
    },
    onError: (e: Error) => {
      toast.error('Status change error: ' + e.message);
    },
  });
}

export function useApproveExecution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ playbookId, executionId }: { playbookId: string; executionId: string }) =>
      approveExecution(playbookId, executionId),
    onSuccess: (data, { playbookId }) => {
      qc.invalidateQueries({ queryKey: KEYS.executions(playbookId) });
      qc.invalidateQueries({ queryKey: ['playbooks', 'full-detail', playbookId] });
      toast.success(`Execution approved — ${data.accounts_count} accounts being processed`);
    },
    onError: (e: Error) => {
      if (e.message.includes('409') || e.message.includes('invalid status') || e.message.includes('statut invalide')) {
        toast.error('This execution has already been processed');
      } else {
        toast.error('Approval error: ' + e.message);
      }
    },
  });
}

export function useRejectExecution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ playbookId, executionId, reason }: { playbookId: string; executionId: string; reason?: string }) =>
      rejectExecution(playbookId, executionId, reason),
    onSuccess: (_data, { playbookId }) => {
      qc.invalidateQueries({ queryKey: KEYS.executions(playbookId) });
      qc.invalidateQueries({ queryKey: ['playbooks', 'full-detail', playbookId] });
      toast.success('Execution rejected');
    },
    onError: (e: Error) => {
      if (e.message.includes('409') || e.message.includes('invalid status') || e.message.includes('statut invalide')) {
        toast.error('This execution has already been processed');
      } else {
        toast.error('Rejection error: ' + e.message);
      }
    },
  });
}

// --- CSV export (chantier A) ---

export function usePlaybookExportPreview(playbookId: string | undefined) {
  return useQuery({
    queryKey: KEYS.exportPreview(playbookId ?? ''),
    queryFn: () => previewPlaybookExport(playbookId ?? ''),
    enabled: !!playbookId,
    staleTime: 30_000,
  });
}

export function usePlaybookRuns(playbookId: string | undefined) {
  return useQuery({
    queryKey: KEYS.runs(playbookId ?? ''),
    queryFn: () => listPlaybookRuns(playbookId ?? ''),
    enabled: !!playbookId,
    staleTime: 15_000,
  });
}

export function useExportPlaybookCsv(playbookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => exportPlaybookCsv(playbookId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.runs(playbookId) });
      toast.success('Export downloaded');
    },
    retry: false,
    onError: (e: Error) => toast.error('Export error: ' + e.message),
  });
}

export function useMarkPlaybookRunExecuted(playbookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (runId: string) => markPlaybookRunExecuted(runId),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: KEYS.runs(playbookId) });
      if (data.updated) {
        toast.success('Run marked as sent');
      } else {
        toast.error('This run was already marked, or no longer exists');
      }
    },
    retry: false,
    onError: (e: Error) => toast.error('Error: ' + e.message),
  });
}
