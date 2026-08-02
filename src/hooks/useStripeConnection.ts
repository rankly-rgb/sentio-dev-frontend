import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  updateStripeConnection,
  disconnectStripeConnection,
  type UpdateStripeConnectionResponse,
  type DisconnectStripeConnectionResponse,
} from '@/lib/queries/stripe-connection-queries';

// Même queryKey que useIntegrationsConfig (useOnboardingFlow.ts) — c'est la
// même ressource GET /integrations-config, réutilisée ici pour l'affichage
// de statut sur Settings plutôt que dupliquée.
const INTEGRATIONS_CONFIG_KEY = 'integrations-config';

export function useUpdateStripeConnection() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<UpdateStripeConnectionResponse, Error, string>({
    mutationFn: (stripeApiKey) => updateStripeConnection(stripeApiKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INTEGRATIONS_CONFIG_KEY, user?.organization_id] });
    },
    retry: false,
  });
}

export function useDisconnectStripeConnection() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<DisconnectStripeConnectionResponse, Error, void>({
    mutationFn: () => disconnectStripeConnection(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INTEGRATIONS_CONFIG_KEY, user?.organization_id] });
    },
    retry: false,
  });
}
