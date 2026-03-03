import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  listPlaybooks,
  getPlaybook,
  createPlaybook,
  updatePlaybookViaApi,
  archivePlaybook,
  executePlaybook,
  listPlaybookExecutions,
} from '@/lib/queries/playbook-queries';
import type {
  PlaybookFilters,
  CreatePlaybookPayload,
  UpdatePlaybookPayload,
  ExecutePlaybookPayload,
} from '@/lib/types/playbook';

const KEYS = {
  all: ['playbooks'] as const,
  list: (orgId: string, filters: PlaybookFilters) => ['playbooks', 'list', orgId, filters] as const,
  detail: (id: string) => ['playbooks', 'detail', id] as const,
  executions: (id: string) => ['playbooks', 'executions', id] as const,
};

export function usePlaybooks(filters: PlaybookFilters = {}) {
  const { user } = useAuth();
  return useQuery({
    queryKey: KEYS.list(user?.organization_id ?? '', filters),
    queryFn: () => listPlaybooks(user!.organization_id, filters),
    enabled: !!user?.organization_id,
    staleTime: 60_000,
  });
}

export function usePlaybook(id: string | undefined) {
  return useQuery({
    queryKey: KEYS.detail(id!),
    queryFn: () => getPlaybook(id!),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function usePlaybookExecutions(playbookId: string | undefined) {
  return useQuery({
    queryKey: KEYS.executions(playbookId!),
    queryFn: () => listPlaybookExecutions(playbookId!),
    enabled: !!playbookId,
    staleTime: 30_000,
  });
}

export function useCreatePlaybook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePlaybookPayload) => createPlaybook(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
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
      qc.invalidateQueries({ queryKey: KEYS.all });
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
      qc.invalidateQueries({ queryKey: KEYS.all });
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
      toast.success(`Exécution lancée : ${data.executions_created} comptes ciblés`);
    },
    onError: (e: Error) => {
      toast.error('Erreur exécution : ' + e.message);
    },
  });
}
