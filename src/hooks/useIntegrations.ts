import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  getIntegrationStatus,
  getAuthorizeUrl,
  revokeIntegration,
  connectStripeApiKey,
  connectHubspotApiKey,
} from '@/lib/queries/integration-queries';
import type {
  IntegrationProvider,
  AuthorizeResponse,
  RevokeResponse,
  ConnectApiKeyResponse,
  ConnectHubspotApiKeyResponse,
} from '@/lib/types/integration';

const KEYS = {
  status: ['integration-status'] as const,
};

export function useIntegrationStatus() {
  const { user } = useAuth();

  return useQuery({
    queryKey: KEYS.status,
    queryFn: getIntegrationStatus,
    enabled: !!user?.organization_id,
    staleTime: 60_000,
  });
}

export function useAuthorize() {
  return useMutation<AuthorizeResponse, Error, IntegrationProvider>({
    mutationFn: (provider) => {
      const redirectAfter = `${window.location.origin}/settings/integrations`;
      return getAuthorizeUrl(provider, redirectAfter);
    },
    onSuccess: (data) => {
      window.location.href = data.authorization_url;
    },
    onError: (e) => {
      toast.error('Erreur connexion OAuth : ' + e.message);
    },
  });
}

export function useRevokeIntegration() {
  const qc = useQueryClient();

  return useMutation<RevokeResponse, Error, IntegrationProvider>({
    mutationFn: (provider) => revokeIntegration(provider),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.status });
      toast.success('Integration deconnectee');
    },
    onError: (e) => {
      toast.error('Erreur deconnexion : ' + e.message);
    },
  });
}

export function useConnectStripeApiKey() {
  const qc = useQueryClient();

  return useMutation<ConnectApiKeyResponse, Error, string>({
    mutationFn: (apiKey) => connectStripeApiKey(apiKey),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: KEYS.status });
      toast.success(
        data.account_name
          ? `Stripe connecté (${data.account_name}) — synchronisation en cours...`
          : 'Stripe connecté via clé API — synchronisation en cours...',
      );
    },
    onError: (e) => {
      toast.error(e.message);
    },
    retry: false,
  });
}

export function useConnectHubspotApiKey() {
  const qc = useQueryClient();

  return useMutation<ConnectHubspotApiKeyResponse, Error, string>({
    mutationFn: (apiKey) => connectHubspotApiKey(apiKey),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: KEYS.status });
      toast.success(
        data.portal_id
          ? `HubSpot connecté (Portal ${data.portal_id}) — synchronisation en cours...`
          : 'HubSpot connecté via clé API — synchronisation en cours...',
      );
    },
    onError: (e) => {
      toast.error(e.message);
    },
    retry: false,
  });
}
