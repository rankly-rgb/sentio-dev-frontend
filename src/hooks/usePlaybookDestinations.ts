import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  listPlaybookDestinations,
  createPlaybookDestination,
  updatePlaybookDestination,
  deletePlaybookDestination,
  testPlaybookDestination,
  listPlaybookExecutionLogs,
  listPendingApprovals,
  countPendingApprovals,
  approveQueueItem,
} from '@/lib/queries/playbook-destination-queries';
import type {
  PlaybookDestination,
  CreatePlaybookDestinationPayload,
  UpdatePlaybookDestinationPayload,
  TestPlaybookDestinationResponse,
  PlaybookApprovalQueueItem,
  ApproveQueueItemPayload,
  ApproveQueueItemResponse,
} from '@/lib/types/playbook-destination';

const KEYS = {
  list: (orgId: string) => ['playbook-destinations', orgId] as const,
  logs: (destId: string) => ['playbook-destination-logs', destId] as const,
  approvals: (orgId: string) => ['playbook-approvals', orgId] as const,
  approvalCount: (orgId: string) => ['playbook-approvals-count', orgId] as const,
};

export function usePlaybookDestinations() {
  const { user } = useAuth();
  const orgId = user?.organization_id ?? '';

  return useQuery({
    queryKey: KEYS.list(orgId),
    queryFn: listPlaybookDestinations,
    enabled: !!user?.organization_id,
  });
}

export function useCreatePlaybookDestination() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const orgId = user?.organization_id ?? '';

  return useMutation<
    PlaybookDestination,
    Error,
    Omit<CreatePlaybookDestinationPayload, 'organization_id'>
  >({
    mutationFn: (payload) =>
      createPlaybookDestination({ ...payload, organization_id: orgId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.list(orgId) });
      toast.success('Destination créée avec succès');
    },
    onError: (e) => {
      toast.error('Erreur : ' + e.message);
    },
    retry: false,
  });
}

export function useUpdatePlaybookDestination() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const orgId = user?.organization_id ?? '';

  return useMutation<
    PlaybookDestination,
    Error,
    { id: string } & UpdatePlaybookDestinationPayload
  >({
    mutationFn: ({ id, ...payload }) => updatePlaybookDestination(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.list(orgId) });
      toast.success('Destination mise à jour');
    },
    onError: (e) => {
      toast.error('Erreur : ' + e.message);
    },
    retry: false,
  });
}

export function useDeletePlaybookDestination() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const orgId = user?.organization_id ?? '';

  return useMutation<void, Error, string>({
    mutationFn: deletePlaybookDestination,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.list(orgId) });
      toast.success('Destination supprimée');
    },
    onError: (e) => {
      toast.error('Erreur suppression : ' + e.message);
    },
    retry: false,
  });
}

export function useTestPlaybookDestination() {
  return useMutation<TestPlaybookDestinationResponse, Error, string>({
    mutationFn: testPlaybookDestination,
    retry: false,
  });
}

export function usePlaybookExecutionLogs(destinationId: string | null) {
  return useQuery({
    queryKey: KEYS.logs(destinationId ?? ''),
    queryFn: () => listPlaybookExecutionLogs(destinationId!),
    enabled: !!destinationId,
  });
}

export function usePendingApprovalsCount() {
  const { user } = useAuth();
  const orgId = user?.organization_id ?? '';

  return useQuery({
    queryKey: KEYS.approvalCount(orgId),
    queryFn: countPendingApprovals,
    enabled: !!user?.organization_id,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}

export function usePendingApprovals() {
  const { user } = useAuth();
  const orgId = user?.organization_id ?? '';

  return useQuery<PlaybookApprovalQueueItem[], Error>({
    queryKey: KEYS.approvals(orgId),
    queryFn: listPendingApprovals,
    enabled: !!user?.organization_id,
    staleTime: 30_000,
  });
}

export function useApproveQueueItem() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const orgId = user?.organization_id ?? '';

  return useMutation<ApproveQueueItemResponse, Error, ApproveQueueItemPayload>({
    mutationFn: approveQueueItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.approvals(orgId) });
      qc.invalidateQueries({ queryKey: KEYS.approvalCount(orgId) });
    },
    retry: false,
  });
}
