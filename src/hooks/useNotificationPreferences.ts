import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { updateNotificationPreferences } from '@/lib/queries/settings';
import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';
import type { NotificationPreferences } from '@/lib/types/settings';

export function useUpdateNotificationPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const orgId = user?.organization_id;

  return useMutation({
    mutationFn: (prefs: NotificationPreferences) => {
      if (!orgId) throw new Error('Organisation non trouvée');
      return updateNotificationPreferences(orgId, prefs);
    },
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', orgId] });
    },
  });
}

interface TestAlertResponse {
  success?: boolean;
  message?: string;
}

export function useSendTestAlert() {
  return useMutation({
    mutationFn: () =>
      fetchWithUserJwt<TestAlertResponse>('churn-alert', {
        method: 'POST',
        body: { test: true },
      }),
    retry: false,
  });
}
