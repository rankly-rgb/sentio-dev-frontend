import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  getIntegrationStatus,
  getAuthorizeUrl,
  revokeIntegration,
  connectStripeApiKey,
  connectHubspotApiKey,
  connectSlackBotToken,
} from '@/lib/queries/integration-queries';
import type {
  IntegrationProvider,
  AuthorizeResponse,
  RevokeResponse,
  ConnectApiKeyResponse,
  ConnectHubspotApiKeyResponse,
  ConnectSlackBotTokenResponse,
} from '@/lib/types/integration';

const KEYS = {
  status: ['integration-status'] as const,
};

// Mission réconciliation Stripe, point 3 (2026-08-20) : sync-stripe est
// déclenché fire-and-forget côté backend pour ce chemin aussi (jamais
// attendu avant la réponse) — la réussite de cette mutation ne garantit
// pas que le sync soit terminé. Invalidation immédiate + une de rattrapage
// à 10s (même raisonnement complet dans useStripeConnection.ts) pour que
// le Dashboard ne reste pas figé sur un état "stale" déjà obsolète en
// pratique. Dupliqué plutôt que partagé — pas d'abstraction pour 4 lignes
// utilisées dans 2 fichiers de concerns différents (connexion Stripe
// Settings vs Integrations).
const DASHBOARD_STALE_CATCHUP_DELAY_MS = 10_000;

function invalidateDashboardWithCatchup(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['dashboard'] });
  setTimeout(() => {
    qc.invalidateQueries({ queryKey: ['dashboard'] });
  }, DASHBOARD_STALE_CATCHUP_DELAY_MS);
}

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
      toast.error('OAuth connection error: ' + e.message);
    },
  });
}

export function useRevokeIntegration() {
  const qc = useQueryClient();

  return useMutation<RevokeResponse, Error, IntegrationProvider>({
    mutationFn: (provider) => revokeIntegration(provider),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.status });
      toast.success('Integration disconnected');
    },
    onError: (e) => {
      toast.error('Disconnection error: ' + e.message);
    },
  });
}

export function useConnectStripeApiKey() {
  const qc = useQueryClient();

  return useMutation<ConnectApiKeyResponse, Error, string>({
    mutationFn: (apiKey) => connectStripeApiKey(apiKey),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: KEYS.status });
      invalidateDashboardWithCatchup(qc);
      toast.success(
        data.account_name
          ? `Stripe connected (${data.account_name}) — syncing...`
          : 'Stripe connected via API key — syncing...',
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
      qc.invalidateQueries({ queryKey: ['syncs'] });
      qc.invalidateQueries({ queryKey: ['sync-status'] });
      toast.success(
        data.portal_id
          ? `HubSpot connected (Portal ${data.portal_id}) — syncing...`
          : 'HubSpot connected via API key — syncing...',
      );
    },
    onError: (e) => {
      toast.error(e.message);
    },
    retry: false,
  });
}

export function useConnectSlackBotToken() {
  const qc = useQueryClient();

  return useMutation<ConnectSlackBotTokenResponse, Error, string>({
    mutationFn: (token) => connectSlackBotToken(token),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: KEYS.status });
      toast.success(
        data.team_name
          ? `Slack connected — Workspace "${data.team_name}"`
          : 'Slack connected via Bot Token',
      );
    },
    onError: (e) => {
      toast.error(e.message);
    },
    retry: false,
  });
}
