import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Pencil, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import AccountFlagsBadges from '@/components/accounts/AccountFlagsBadges';
import { useT } from '@/lib/i18n/useT';
import { useSegmentLabels } from '@/lib/i18n/useSegmentLabels';
import { SEGMENT_COLORS } from '@/lib/types/segments';
import { monthsSince } from '@/lib/account-detail-helpers';
import { useUpdateDisplayName } from '@/hooks/useUpdateDisplayName';
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
  const fr = useT();
  const segmentLabels = useSegmentLabels();
  const primarySegment = account.segments[0]?.account_segments;
  const updateDisplayName = useUpdateDisplayName();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(account.display_name ?? '');
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setDraft(account.display_name ?? '');
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const cancelEdit = () => {
    setEditing(false);
    setDraft(account.display_name ?? '');
  };

  const saveEdit = async () => {
    const trimmed = draft.trim();
    const value = trimmed.length > 0 ? trimmed : null;
    try {
      await updateDisplayName.mutateAsync({ accountId: account.id, displayName: value });
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast.success(fr.accountName.saveSuccess);
    } catch {
      toast.error(fr.accountName.saveError);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') cancelEdit();
  };

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
            {segmentLabels[primarySegment.segment_type] ?? primarySegment.segment_name}
          </span>
        )}
      </div>

      {/* Display name / inline edit */}
      {editing ? (
        <div className="flex items-center gap-1.5">
          <input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={saveEdit}
            placeholder={fr.accountName.placeholder}
            className="text-sm border border-border rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary w-48"
          />
          <button type="button" onMouseDown={(e) => { e.preventDefault(); saveEdit(); }} className="text-success hover:text-success/80">
            <Check className="h-4 w-4" />
          </button>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); cancelEdit(); }} className="text-muted-foreground hover:text-destructive">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : account.display_name ? (
        <div className="flex items-center gap-1.5 group">
          <span className={`font-semibold text-sm transition-all ${saved ? 'text-success' : ''}`}>
            {account.display_name}
          </span>
          <button
            type="button"
            onClick={startEdit}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
            aria-label={fr.accountName.editName}
          >
            <Pencil className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={startEdit}
          className="text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          {fr.accountName.addName}
        </button>
      )}

      {/* Stripe ID */}
      <p className="font-mono text-xs text-muted-foreground">{account.stripe_customer_id}</p>

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
