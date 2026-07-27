import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeToPlan } from '@/lib/queries/pricing-queries';
import type { SelfServeTargetTier } from '@/lib/types/plan-tier';

// Wraps POST /sentio-billing/subscribe (API_CONTRACTS.md § 8.3). This does NOT return a
// Stripe Checkout/Billing Portal redirect URL — the backend calls the Stripe Subscriptions
// API directly with payment_behavior: default_incomplete and no payment-method collection
// step (no client_secret returned). An upgrade to "growth" will therefore come back with
// status "incomplete" today — see SubscriptionCta.tsx for how that's surfaced to the user.
export function useSubscribeToPlan() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (targetPlanTier: SelfServeTargetTier) =>
      subscribeToPlan({ target_plan_tier: targetPlanTier }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-status', user?.organization_id] });
    },
  });
}
