import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { fr } from '@/i18n/fr';
import type { TodayAccount } from '@/lib/queries/today';

interface ExpansionCardProps {
  account: TodayAccount;
}

export default function ExpansionCard({ account }: ExpansionCardProps) {
  const seatPct = account.seat_count != null && account.seat_limit != null && account.seat_limit > 0
    ? Math.round((account.seat_count / account.seat_limit) * 100)
    : null;

  return (
    <Card className="border-emerald-200 bg-emerald-50/50">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>{'\uD83D\uDFE2'}</span>
            <span className="font-semibold text-sm">{account.stripe_customer_id}</span>
          </div>
          <span className="text-sm font-medium">
            {fr.format.currency(account.mrr_cents)}{fr.today.perMonth}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {seatPct != null && (
            <span>{fr.today.seatUsage(seatPct)}</span>
          )}
          {seatPct != null && seatPct >= 90 && (
            <>
              <span>&middot;</span>
              <span>{fr.today.featuresMaxed}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/accounts/${account.id}`}>{fr.today.viewAccount}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
