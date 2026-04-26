import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  getDestinations,
  createDestination,
  updateDestination,
  deleteDestination,
  testDestination,
  getDestinationLogs,
} from '@/lib/queries/webhook-destination-queries';
import type {
  OutboundWebhookDestination,
  CreateDestinationPayload,
  UpdateDestinationPayload,
  TestDestinationResponse,
} from '@/lib/types/webhook-destinations';

const KEYS = {
  list: (orgId: string) => ['webhook-destinations', orgId] as const,
  logs: (destId: string) => ['webhook-destination-logs', destId] as const,
};

export function useDestinations() {
  const { user } = useAuth();
  const orgId = user?.organization_id ?? '';

  return useQuery({
    queryKey: KEYS.list(orgId),
    queryFn: getDestinations,
    enabled: !!user?.organization_id,
  });
}

export function useCreateDestination() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const orgId = user?.organization_id ?? '';

  return useMutation<
    OutboundWebhookDestination,
    Error,
    Omit<CreateDestinationPayload, 'organization_id'>
  >({
    mutationFn: (payload) => createDestination({ ...payload, organization_id: orgId }),
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

export function useUpdateDestination() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const orgId = user?.organization_id ?? '';

  return useMutation<
    OutboundWebhookDestination,
    Error,
    { id: string } & UpdateDestinationPayload
  >({
    mutationFn: ({ id, ...payload }) => updateDestination(id, payload),
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

export function useDeleteDestination() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const orgId = user?.organization_id ?? '';

  return useMutation<void, Error, string>({
    mutationFn: deleteDestination,
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

export function useTestDestination() {
  return useMutation<TestDestinationResponse, Error, string>({
    mutationFn: testDestination,
    retry: false,
  });
}

export function useDestinationLogs(destinationId: string | null) {
  return useQuery({
    queryKey: KEYS.logs(destinationId ?? ''),
    queryFn: () => getDestinationLogs(destinationId!),
    enabled: !!destinationId,
  });
}
