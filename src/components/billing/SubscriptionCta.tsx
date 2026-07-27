import { useState } from 'react';
import { CalendarClock, ArrowUpCircle, ArrowDownCircle, Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useT } from '@/lib/i18n/useT';
import { usePlanTierStatus } from '@/hooks/usePlanTierStatus';
import { useSubscribeToPlan } from '@/hooks/useSubscribeToPlan';

interface Props {
  // FR-005 — the commercial call proposal is only ever shown on the Stripe-connect
  // screen, and only in addition to (never instead of) the self-serve flow
  context?: 'default' | 'stripe-connect';
}

export default function SubscriptionCta({ context = 'default' }: Props) {
  const fr = useT();
  const { data, isLoading, error } = usePlanTierStatus();
  const subscribeMutation = useSubscribeToPlan();

  // Once an upgrade attempt has come back non-active, keep showing the "coming soon"
  // state rather than re-enabling the button — the backend creates a real (if unpayable)
  // Stripe subscription on every call, so this isn't just cosmetic debouncing
  const [upgradePending, setUpgradePending] = useState(false);
  const [downgradeDone, setDowngradeDone] = useState(false);

  if (isLoading) {
    return <Skeleton className="h-10 w-48" />;
  }

  // FR-008 / Edge Cases — never default to a self-serve or RDV CTA while the tier is
  // unknown; an explicit error is safer than guessing either branch
  if (error || !data) {
    return (
      <p className="text-sm text-destructive">{fr.pricingTiers.loadError}</p>
    );
  }

  // FR-006 — requires_appointment is consumed as-is from the API, never derived from
  // plan_tier locally (FR-007); this branch always wins over the self-serve one below,
  // including on the Stripe-connect screen (overrides the US2 call proposal for this tier)
  if (data.requires_appointment) {
    const bookingUrl = import.meta.env.VITE_APPOINTMENT_BOOKING_URL as string | undefined;
    return (
      <Button
        onClick={() => {
          if (bookingUrl) window.open(bookingUrl, '_blank', 'noopener,noreferrer');
        }}
        disabled={!bookingUrl}
      >
        <CalendarClock className="h-4 w-4 mr-2" />
        {fr.pricingTiers.requestMeeting}
      </Button>
    );
  }

  const handleUpgrade = () => {
    subscribeMutation.mutate('growth', {
      onSuccess: (result) => {
        // status will realistically always land here today — see useSubscribeToPlan.ts
        if (result.status !== 'active') {
          setUpgradePending(true);
        }
      },
    });
  };

  const handleDowngrade = () => {
    subscribeMutation.mutate('free', {
      onSuccess: () => setDowngradeDone(true),
    });
  };

  return (
    <div className="space-y-3">
      {data.plan_tier === 'free' && !upgradePending && (
        <Button onClick={handleUpgrade} disabled={subscribeMutation.isPending}>
          <ArrowUpCircle className="h-4 w-4 mr-2" />
          {subscribeMutation.isPending ? <Clock className="h-4 w-4 mr-2 animate-spin" /> : null}
          {fr.pricingTiers.upgradeToGrowth}
        </Button>
      )}

      {upgradePending && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="p-3 space-y-1">
            <p className="text-sm font-medium text-amber-800">{fr.pricingTiers.upgradePendingTitle}</p>
            <p className="text-xs text-amber-700">{fr.pricingTiers.upgradePendingBody}</p>
          </CardContent>
        </Card>
      )}

      {subscribeMutation.isError && !upgradePending && (
        <p className="text-xs text-destructive">{fr.pricingTiers.upgradeError}</p>
      )}

      {data.plan_tier === 'growth' && !downgradeDone && (
        <Button variant="outline" onClick={handleDowngrade} disabled={subscribeMutation.isPending}>
          <ArrowDownCircle className="h-4 w-4 mr-2" />
          {fr.pricingTiers.downgradeToFree}
        </Button>
      )}

      {downgradeDone && (
        <p className="text-sm text-emerald-700">{fr.pricingTiers.downgradeSuccess}</p>
      )}

      {/* Neither 'free' nor 'growth' but requires_appointment is false — an unrecognized
          future tier value. Per spec Edge Cases, fall back rather than assume a self-serve
          action we don't actually know how to perform */}
      {data.plan_tier !== 'free' && data.plan_tier !== 'growth' && (
        <p className="text-sm text-muted-foreground">{fr.pricingTiers.manageSubscription}</p>
      )}

      {context === 'stripe-connect' && (
        <Card>
          <CardContent className="p-3 space-y-1">
            <p className="text-sm font-medium">{fr.pricingTiers.callProposalTitle}</p>
            <p className="text-xs text-muted-foreground">{fr.pricingTiers.callProposalBody}</p>
            {(() => {
              const bookingUrl = import.meta.env.VITE_APPOINTMENT_BOOKING_URL as string | undefined;
              return (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-1"
                  onClick={() => {
                    if (bookingUrl) window.open(bookingUrl, '_blank', 'noopener,noreferrer');
                  }}
                  disabled={!bookingUrl}
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  {fr.pricingTiers.requestMeeting}
                </Button>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
