import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  getWebhookConfig,
  upsertWebhookConfig,
  testWebhook,
  regenerateWebhookSecret,
  disableWebhook,
} from '@/lib/queries/webhook-queries';
import type {
  UpsertWebhookPayload,
  UpsertWebhookResponse,
  TestWebhookResponse,
  RegenerateSecretResponse,
} from '@/lib/types/webhook';

const KEYS = {
  config: (orgId: string) => ['webhook-config', orgId] as const,
};

export function useWebhookConfig() {
  const { user } = useAuth();
  const orgId = user?.organization_id ?? '';

  return useQuery({
    queryKey: KEYS.config(orgId),
    queryFn: () => getWebhookConfig(orgId),
    enabled: !!user?.organization_id,
    staleTime: 60_000,
  });
}

export function useUpsertWebhook() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const orgId = user?.organization_id ?? '';

  return useMutation<UpsertWebhookResponse, Error, UpsertWebhookPayload>({
    mutationFn: (payload) => upsertWebhookConfig(orgId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.config(orgId) });
    },
    onError: (e) => {
      toast.error('Erreur configuration webhook : ' + e.message);
    },
  });
}

export function useTestWebhook() {
  const { user } = useAuth();
  const orgId = user?.organization_id ?? '';

  return useMutation<TestWebhookResponse, Error, void>({
    mutationFn: () => testWebhook(orgId),
    onError: (e) => {
      toast.error('Erreur test webhook : ' + e.message);
    },
  });
}

export function useRegenerateWebhookSecret() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const orgId = user?.organization_id ?? '';

  return useMutation<RegenerateSecretResponse, Error, void>({
    mutationFn: () => regenerateWebhookSecret(orgId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.config(orgId) });
      toast.success('Secret regenere avec succes');
    },
    onError: (e) => {
      toast.error('Erreur regeneration secret : ' + e.message);
    },
  });
}

export function useDisableWebhook() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const orgId = user?.organization_id ?? '';

  return useMutation<void, Error, void>({
    mutationFn: () => disableWebhook(orgId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.config(orgId) });
      toast.success('Webhook desactive');
    },
    onError: (e) => {
      toast.error('Erreur desactivation webhook : ' + e.message);
    },
  });
}
