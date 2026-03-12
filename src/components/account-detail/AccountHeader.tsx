import { Badge } from '@/components/ui/badge';
import AccountFlagsBadges from '@/components/accounts/AccountFlagsBadges';
import { fr } from '@/i18n/fr';
import { SEGMENT_COLORS, SEGMENT_LABELS } from '@/lib/types/segments';
import { monthsSince } from '@/lib/account-detail-helpers';
import type { AccountDetail } from '@/lib/types/accounts';

interface Props {
  account: AccountDetail;
}

const PLAN_COLORS: Record<string, string> = {
  starter: 'bg-gray-100 text-gray-700',
  growth: 'bg-blue-100 text-blue-700',
  enterprise: 'bg-violet-100 text-violet-700',
};

export default function AccountHeader({ account }: Props) {
  const primarySegment = account.segments[0]?.account_segments;

  return (
    <div className="space-y-2">
      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-1.5">
        {account.plan_tier && (
          <Badge
            variant="outline"
            className={PLAN_COLORS[account.plan_tier] ?? 'bg-gray-100 text-gray-700'}
          >
            {fr.accounts[account.plan_tier as keyof typeof fr.accounts] ?? account.plan_tier}
          </Badge>
        )}
        {account.billing_interval && (
          <Badge variant="secondary">
            {account.billing_interval === 'monthly'
              ? fr.accounts.monthly
              : account.billing_interval === 'annual'
                ? fr.accounts.annual
                : account.billing_interval}
          </Badge>
        )}
        {primarySegment && (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              SEGMENT_COLORS[primarySegment.segment_type]?.text ?? 'text-gray-700'
            } ${SEGMENT_COLORS[primarySegment.segment_type]?.bg ?? 'bg-gray-100'}`}
          >
            {SEGMENT_LABELS[primarySegment.segment_type] ?? primarySegment.segment_name}
          </span>
        )}
      </div>

      {/* Stripe ID */}
      <p className="font-mono text-sm font-semibold">{account.stripe_customer_id}</p>

      {/* HubSpot ID */}
      {account.hubspot_company_id && (
        <p className="text-xs text-muted-foreground">
          HubSpot : {account.hubspot_company_id}
        </p>
      )}

      {/* Client since */}
      <p className="text-xs text-muted-foreground">
        Client depuis {monthsSince(account.created_at)}
      </p>

      {/* Flags */}
      {account.flags.length > 0 && (
        <AccountFlagsBadges flags={account.flags} />
      )}
    </div>
  );
}
