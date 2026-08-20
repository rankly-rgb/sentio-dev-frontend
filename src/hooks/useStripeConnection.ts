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

// Mission réconciliation Stripe, point 3 (2026-08-20) : les 4 chemins
// backend qui écrivent une connexion Stripe (`update-stripe-connection`
// inclus) déclenchent tous `sync-stripe` en fire-and-forget
// (`EdgeRuntime.waitUntil`, jamais attendu avant la réponse HTTP) —
// confirmé présent depuis la toute première version de ces endpoints,
// PAS une régression des PR #90/#91 (`git log -p` sur ce fichier : le
// pattern `waitUntil` existe depuis le commit initial de la fonction,
// bien avant #90). Conséquence : le succès de cette mutation ne garantit
// PAS que `data_syncs.sync_status='completed'` existe encore — invalider
// `['dashboard']` seulement ici (comme le faisait déjà useManualSync,
// mais que useStripeConnection ne faisait PAS du tout avant ce correctif)
// peut donc déclencher un refetch qui lit encore `stripe_stale=true`
// (correct à cet instant), que React Query met ensuite en cache pendant
// `staleTime` (120s, useDashboardData.ts) — bandeau visible pendant 2
// minutes après un sync en réalité déjà terminé. Root cause confirmée :
// un problème de staleness/cache côté client, pas un `stripe_connected`
// mal écrit ni mal lu côté backend (vérifié dans dashboard-api/index.ts :
// `stripe_stale` reflète fidèlement `computeSyncFreshness` à l'instant T).
//
// Deuxième invalidation différée (10s, même cadence que le polling déjà
// utilisé par useSyncStatus.ts) pour rattraper la fin du sync
// fire-and-forget une fois qu'il a eu le temps de se terminer — le cas
// réel observé (App'Ines, PARKING_LOT.md 2026-08-17) a duré 3-7s.
const DASHBOARD_STALE_CATCHUP_DELAY_MS = 10_000;

function invalidateDashboardWithCatchup(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  setTimeout(() => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  }, DASHBOARD_STALE_CATCHUP_DELAY_MS);
}

export function useUpdateStripeConnection() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<UpdateStripeConnectionResponse, Error, string>({
    mutationFn: (stripeApiKey) => updateStripeConnection(stripeApiKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INTEGRATIONS_CONFIG_KEY, user?.organization_id] });
      invalidateDashboardWithCatchup(queryClient);
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
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    retry: false,
  });
}
