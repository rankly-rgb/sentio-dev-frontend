import { Loader2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useT } from '@/lib/i18n/useT';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionStatus, useStartCheckout } from '@/hooks/useSubscription';
import type { SubscriptionTier } from '@/lib/types/subscription';

function formatPrice(cents: number | null, currency: string, fr: ReturnType<typeof useT>): string {
  if (cents === null) return fr.settings.billing.custom;
  if (cents === 0) return fr.settings.billing.free;
  return `${fr.format.currency(cents, currency)}${fr.settings.billing.perMonth}`;
}

function TierCard({
  tier,
  isCurrent,
  currency,
  onUpgrade,
  isCheckingOut,
}: {
  tier: SubscriptionTier;
  isCurrent: boolean;
  currency: string;
  onUpgrade: (tier: 'growth' | 'scale') => void;
  isCheckingOut: boolean;
}) {
  const fr = useT();
  return (
    <Card className={isCurrent ? 'border-primary' : undefined}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{tier.display_name}</CardTitle>
          {isCurrent && <Badge>{fr.settings.billing.currentPlanBadge}</Badge>}
        </div>
        <p className="text-2xl font-bold">{formatPrice(tier.price_cents_monthly, currency, fr)}</p>
        <p className="text-sm text-muted-foreground">
          {tier.max_accounts === null
            ? 'Unlimited accounts'
            : `Up to ${tier.max_accounts.toLocaleString('en-US')} accounts`}
        </p>
      </CardHeader>
      <CardContent>
        {isCurrent ? (
          <Button variant="outline" disabled className="w-full">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {fr.settings.billing.currentPlanBadge}
          </Button>
        ) : tier.cta === 'contact_sales' ? (
          <Button asChild variant="outline" className="w-full">
            <a href="mailto:contact@sentio.ai?subject=Enterprise%20plan">{fr.settings.billing.contactSales}</a>
          </Button>
        ) : (
          <Button
            className="w-full"
            disabled={isCheckingOut}
            onClick={() => onUpgrade(tier.key as 'growth' | 'scale')}
          >
            {isCheckingOut ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {fr.settings.billing.startingCheckout}
              </>
            ) : (
              fr.settings.billing.upgrade
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function BillingSection() {
  const fr = useT();
  const { user } = useAuth();
  const currency = user?.currency ?? 'usd';
  const { data: status, isLoading } = useSubscriptionStatus();
  const checkout = useStartCheckout();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (!status) return null;

  const currentTier = status.tiers.find((t) => t.key === status.current_tier);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{fr.settings.billing.currentPlan}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-lg font-medium">{currentTier?.display_name ?? status.current_tier}</p>
          <p className="text-sm text-muted-foreground">
            {status.max_accounts === null
              ? fr.settings.billing.accountsUsedUnlimited(status.accounts_count)
              : fr.settings.billing.accountsUsed(status.accounts_count, status.max_accounts)}
          </p>
          {status.is_over_limit && (
            <p className="text-sm text-destructive font-medium">{fr.settings.billing.overLimitWarning}</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {status.tiers.map((tier) => (
          <TierCard
            key={tier.key}
            tier={tier}
            isCurrent={tier.key === status.current_tier}
            currency={currency}
            onUpgrade={(t) => checkout.mutate(t)}
            isCheckingOut={checkout.isPending && checkout.variables === tier.key}
          />
        ))}
      </div>
    </div>
  );
}
