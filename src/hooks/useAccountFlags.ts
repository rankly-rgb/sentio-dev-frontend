import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { AccountFlag } from '@/types/database';

interface RemoveFlagParams {
  accountId: string;
  flagName: string;
}

export function useRemoveAccountFlag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ accountId, flagName }: RemoveFlagParams) => {
      const { data: account, error: fetchError } = await supabase
        .from('accounts')
        .select('flags')
        .eq('id', accountId)
        .single();

      if (fetchError) throw fetchError;

      const currentFlags: AccountFlag[] = Array.isArray(account.flags) ? account.flags : [];
      const updatedFlags = currentFlags.filter((f: AccountFlag) => f.flag !== flagName);

      const { error: updateError } = await supabase
        .from('accounts')
        .update({ flags: updatedFlags })
        .eq('id', accountId);

      if (updateError) throw updateError;
      return updatedFlags;
    },
    retry: false,
    onSuccess: (_data, { accountId }) => {
      void queryClient.invalidateQueries({ queryKey: ['accounts', 'detail', accountId] });
      void queryClient.invalidateQueries({ queryKey: ['accounts', 'list'] });
    },
  });
}
