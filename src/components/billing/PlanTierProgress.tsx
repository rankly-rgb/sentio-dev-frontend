import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useT } from '@/lib/i18n/useT';
import { usePlanTierStatus } from '@/hooks/usePlanTierStatus';

export default function PlanTierProgress() {
  const fr = useT();
  const { data, isLoading, error } = usePlanTierStatus();

  // FR-008 — explicit loading/error states; never guess a tier or ratio while unavailable
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-2 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-4">
          <p className="text-sm text-destructive">{fr.pricingTiers.loadError}</p>
        </CardContent>
      </Card>
    );
  }

  const tierLabel = fr.pricingTiers.tierName[data.plan_tier] ?? data.plan_tier;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <span>{fr.pricingTiers.currentPlan}</span>
          <span className="text-primary">{tierLabel}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.max_active_accounts === null ? (
          // Acceptance Scenario 2 — no ratio against a nonexistent limit
          <p className="text-sm text-muted-foreground">{fr.pricingTiers.unlimited}</p>
        ) : (
          <>
            <Progress
              value={Math.min(100, data.usage_pct ?? 0)}
              className={data.alert_active ? '[&>div]:bg-destructive' : ''}
            />
            <p className="text-sm text-muted-foreground">
              {fr.pricingTiers.accountsTracked(data.active_accounts_count, data.max_active_accounts)}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
