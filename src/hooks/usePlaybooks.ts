import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  listPlaybooks,
  listPlaybookTemplates,
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
} from '@/lib/queries/playbook-queries';
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
      // Invalider seulement les listes, pas les détails/exécutions existants
      qc.invalidateQueries({ queryKey: ['playbooks', 'list'] });
      qc.invalidateQueries({ queryKey: ['playbooks', 'templates'] });
      toast.success('Playbook créé avec succès');
    },
    onError: (e: Error) => {
      toast.error('Erreur création playbook : ' + e.message);
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
      toast.success('Playbook mis à jour');
    },
    onError: (e: Error) => {
      toast.error('Erreur mise à jour : ' + e.message);
    },
  });
}

export function useArchivePlaybook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archivePlaybook(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['playbooks', 'list'] });
      toast.success('Playbook archivé');
    },
    onError: (e: Error) => {
      toast.error('Erreur archivage : ' + e.message);
    },
  });
}

export function useExecutePlaybook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ExecutePlaybookPayload) => executePlaybook(payload),
    onSuccess: (data, { playbook_id }) => {
      qc.invalidateQueries({ queryKey: KEYS.executions(playbook_id) });
      qc.invalidateQueries({ queryKey: KEYS.detail(playbook_id) });

      // Build enriched summary
      const results = data.results ?? [];
      const completed = results.filter(r => r.status === 'completed').length;
      const failed = results.filter(r => r.status === 'failed').length;
      const skipped = results.filter(r => r.status === 'skipped').length;

      let msg = `${data.executions_created} comptes traités`;
      if (completed > 0 || failed > 0 || skipped > 0) {
        const parts: string[] = [];
        if (completed > 0) parts.push(`${completed} réussis`);
        if (failed > 0) parts.push(`${failed} échoués`);
        if (skipped > 0) parts.push(`${skipped} ignorés`);
        msg += ` — ${parts.join(', ')}`;
      }
      toast.success(msg);

      // Warn about skipped actions
      const hasSkipped = data.actions_summary?.some(a => a.status === 'skipped');
      if (hasSkipped) {
        toast.warning('Certaines actions ont été ignorées. Vérifiez la configuration des intégrations.', {
          duration: 8000,
        });
      }
    },
    onError: (e: Error) => {
      toast.error('Erreur exécution : ' + e.message);
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
      toast.error('Erreur changement de statut : ' + e.message);
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
      toast.success(`Exécution approuvée — ${data.accounts_count} comptes en cours de traitement`);
    },
    onError: (e: Error) => {
      if (e.message.includes('409') || e.message.includes('statut invalide')) {
        toast.error('Cette exécution a déjà été traitée');
      } else {
        toast.error('Erreur approbation : ' + e.message);
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
      toast.success('Exécution rejetée');
    },
    onError: (e: Error) => {
      if (e.message.includes('409') || e.message.includes('statut invalide')) {
        toast.error('Cette exécution a déjà été traitée');
      } else {
        toast.error('Erreur rejet : ' + e.message);
      }
    },
  });
}
