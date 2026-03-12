import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAccountDetail } from '@/hooks/useAccountDetail';

const ACCOUNT_PARAM = 'account';

export function useAccountDetailPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedAccountId = searchParams.get(ACCOUNT_PARAM) ?? null;

  const { data: account, isLoading, error } = useAccountDetail(
    selectedAccountId ?? undefined,
  );

  const openPanel = useCallback(
    (accountId: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set(ACCOUNT_PARAM, accountId);
        return next;
      });
    },
    [setSearchParams],
  );

  const closePanel = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete(ACCOUNT_PARAM);
      return next;
    });
  }, [setSearchParams]);

  return {
    selectedAccountId,
    isOpen: !!selectedAccountId,
    account: account ?? null,
    isLoading,
    error,
    openPanel,
    closePanel,
  };
}
