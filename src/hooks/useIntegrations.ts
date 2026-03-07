import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  getIntegrationStatus,
  getAuthorizeUrl,
  revokeIntegration,
} from '@/lib/queries/integration-queries';
import type {
  IntegrationProvider,
  AuthorizeResponse,
  RevokeResponse,
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
    mutationFn: (provider) => getAuthorizeUrl(provider),
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
