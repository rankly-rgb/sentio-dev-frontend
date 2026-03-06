import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  getCriticalAccounts,
  getAtRiskAccounts,
  getExpansionAccounts,
  getNextRenewalDays,
} from '@/lib/queries/today';

const KEYS = {
  p0: (orgId: string) => ['today', 'p0', orgId] as const,
  p1: (orgId: string) => ['today', 'p1', orgId] as const,
  expansion: (orgId: string) => ['today', 'expansion', orgId] as const,
  nextRenewal: (orgId: string) => ['today', 'next-renewal', orgId] as const,
};

export function useTodayP0() {
  const { user } = useAuth();
  const orgId = user?.organization_id ?? '';
  return useQuery({
    queryKey: KEYS.p0(orgId),
    queryFn: () => getCriticalAccounts(orgId),
    enabled: !!user?.organization_id,
    staleTime: 120_000,
  });
}

export function useTodayP1() {
  const { user } = useAuth();
  const orgId = user?.organization_id ?? '';
  return useQuery({
    queryKey: KEYS.p1(orgId),
    queryFn: () => getAtRiskAccounts(orgId),
    enabled: !!user?.organization_id,
    staleTime: 120_000,
  });
}

export function useTodayExpansion() {
  const { user } = useAuth();
  const orgId = user?.organization_id ?? '';
  return useQuery({
    queryKey: KEYS.expansion(orgId),
    queryFn: () => getExpansionAccounts(orgId),
    enabled: !!user?.organization_id,
    staleTime: 120_000,
  });
}

export function useNextRenewal() {
  const { user } = useAuth();
  const orgId = user?.organization_id ?? '';
  return useQuery({
    queryKey: KEYS.nextRenewal(orgId),
    queryFn: () => getNextRenewalDays(orgId),
    enabled: !!user?.organization_id,
    staleTime: 300_000,
  });
}
