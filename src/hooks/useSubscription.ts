import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getSubscriptionStatus, createBillingCheckout } from '@/lib/queries/subscription-queries';

export function useSubscriptionStatus() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['subscription', 'status', user?.organization_id ?? ''],
    queryFn: getSubscriptionStatus,
    enabled: !!user?.organization_id,
    staleTime: 60_000,
  });
}

export function useStartCheckout() {
  return useMutation({
    mutationFn: (tier: 'growth' | 'scale') => createBillingCheckout(tier),
    onSuccess: (data) => {
      window.location.href = data.checkout_url;
    },
    retry: false,
    onError: (e: Error) => toast.error('Checkout error: ' + e.message),
  });
}
