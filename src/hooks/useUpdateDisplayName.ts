import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';

interface UpdateDisplayNameResponse {
  data: { id: string; display_name: string | null };
}

export function useUpdateDisplayName() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ accountId, displayName }: { accountId: string; displayName: string | null }) => {
      const res = await fetchWithUserJwt<UpdateDisplayNameResponse>(
        `accounts-api?id=${accountId}`,
        { method: 'PATCH', body: { display_name: displayName } },
      );
      return { accountId, displayName: res.data.display_name };
    },
    onSuccess: ({ accountId }) => {
      queryClient.invalidateQueries({ queryKey: ['account', accountId] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    retry: false,
  });
}
