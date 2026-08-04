import { useT } from '@/lib/i18n/useT';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { AccountDetail, InvoiceItem } from '@/lib/types/accounts';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { MrrMovementType } from '@/types/database';

interface MrrMovementRow {
  id: string;
  movement_type: MrrMovementType;
  amount_cents: number;
  movement_date: string;
}

function useMrrMovements(accountId: string) {
  const { user } = useAuth();
  return useQuery<MrrMovementRow[]>({
    queryKey: ['mrr-movements', accountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mrr_movements')
        .select('id, movement_type, amount_cents, movement_date')
        .eq('account_id', accountId)
        .order('movement_date', { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as MrrMovementRow[];
    },
    enabled: !!user?.organization_id,
    staleTime: 60_000,
  });
}

// Split overdue at the same 15-day boundary as the churn risk signals
// (invoice_overdue_15d = CRITIQUE, invoice_overdue_under_15d = MINEUR,
// _shared/scoring.ts / calculate-scores/index.ts:379-381) instead of a single
// undifferentiated "overdue" bucket — a 1-day-late invoice and a 40-day-late
// one previously looked identically alarming here despite only the latter
// driving the account's churn risk score.
const OVERDUE_CRITICAL_DAYS = 15;

function computeInvoiceTotals(invoices: InvoiceItem[]) {
  let paid = 0;
  let paidCount = 0;
  let due = 0;
  let dueCount = 0;
  let overdueMinor = 0;
  let overdueMinorCount = 0;
  let overdueCritical = 0;
  let overdueCriticalCount = 0;
  const now = Date.now();

  for (const inv of invoices) {
    if (inv.status === 'paid') {
      paid += inv.amount_cents;
      paidCount++;
    } else if (inv.status === 'open') {
      const daysOverdue = inv.due_date ? Math.floor((now - new Date(inv.due_date).getTime()) / 86400000) : 0;
      if (daysOverdue >= OVERDUE_CRITICAL_DAYS) {
        overdueCritical += inv.amount_cents;
        overdueCriticalCount++;
      } else if (daysOverdue > 0) {
        overdueMinor += inv.amount_cents;
        overdueMinorCount++;
      } else {
        due += inv.amount_cents;
        dueCount++;
      }
    }
  }

  return {
    paid, paidCount, due, dueCount,
    overdueMinor, overdueMinorCount,
    overdueCritical, overdueCriticalCount,
    total: paid + due + overdueMinor + overdueCritical,
  };
}

const MOVEMENT_COLORS: Record<string, string> = {
  new: 'text-green-600',
  expansion: 'text-green-600',
  contraction: 'text-red-600',
  churn: 'text-red-600',
  reactivation: 'text-blue-600',
};

interface Props {
  account: AccountDetail;
}

export default function AccountFinancials({ account }: Props) {
  const fr = useT();
  const { user } = useAuth();
  const currency = user?.currency ?? 'usd';
  const MOVEMENT_LABELS: Record<string, string> = {
    new: fr.mrr.new,
    expansion: fr.mrr.expansion,
    contraction: fr.mrr.contraction,
    churn: fr.mrr.churn,
    reactivation: fr.mrr.reactivation,
  };
  const { data: movements, isLoading: movementsLoading } = useMrrMovements(account.id);
  const invoiceTotals = computeInvoiceTotals(account.recent_invoices);

  return (
    <div className="space-y-4">
      {/* MRR / ARR / Seats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs text-muted-foreground">MRR</p>
          <p className="text-sm font-bold">
            {fr.format.mrrOrUnavailable(account.mrr_cents, currency, account.mrr_status === 'unavailable')}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">ARR</p>
          <p className="text-sm font-bold">
            {fr.format.mrrOrUnavailable(account.arr_cents, currency, account.mrr_status === 'unavailable')}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{fr.accounts.seats}</p>
          <p className="text-sm font-bold">
            {account.seat_count ?? '—'}/{account.seat_limit ?? '∞'}
          </p>
        </div>
      </div>

      {/* Invoice stacked bar */}
      {invoiceTotals.total > 0 && (
        <div className="space-y-1.5">
          <div className="flex h-3 w-full overflow-hidden rounded-full">
            {invoiceTotals.paid > 0 && (
              <div
                className="bg-green-500 h-full"
                style={{ width: `${(invoiceTotals.paid / invoiceTotals.total) * 100}%` }}
              />
            )}
            {invoiceTotals.due > 0 && (
              <div
                className="bg-yellow-400 h-full"
                style={{ width: `${(invoiceTotals.due / invoiceTotals.total) * 100}%` }}
              />
            )}
            {invoiceTotals.overdueMinor > 0 && (
              <div
                className="bg-orange-400 h-full"
                style={{ width: `${(invoiceTotals.overdueMinor / invoiceTotals.total) * 100}%` }}
              />
            )}
            {invoiceTotals.overdueCritical > 0 && (
              <div
                className="bg-red-500 h-full"
                style={{ width: `${(invoiceTotals.overdueCritical / invoiceTotals.total) * 100}%` }}
              />
            )}
          </div>
          <div className="flex gap-3 text-[11px] text-muted-foreground flex-wrap">
            <span>
              <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-1" />
              Paid: {fr.format.currency(invoiceTotals.paid, currency)} ({invoiceTotals.paidCount})
            </span>
            <span>
              <span className="inline-block h-2 w-2 rounded-full bg-yellow-400 mr-1" />
              Due: {fr.format.currency(invoiceTotals.due, currency)} ({invoiceTotals.dueCount})
            </span>
            {invoiceTotals.overdueMinor > 0 && (
              <span>
                <span className="inline-block h-2 w-2 rounded-full bg-orange-400 mr-1" />
                Overdue &lt;15d: {fr.format.currency(invoiceTotals.overdueMinor, currency)} ({invoiceTotals.overdueMinorCount})
              </span>
            )}
            {invoiceTotals.overdueCritical > 0 && (
              <span>
                <span className="inline-block h-2 w-2 rounded-full bg-red-500 mr-1" />
                Overdue 15d+: {fr.format.currency(invoiceTotals.overdueCritical, currency)} ({invoiceTotals.overdueCriticalCount})
              </span>
            )}
          </div>
        </div>
      )}

      {/* MRR movements */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">{fr.mrr.movements}</p>
        {movementsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : !movements || movements.length === 0 ? (
          <p className="text-xs text-muted-foreground">{fr.accountDetail.noData}</p>
        ) : (
          <div className="space-y-1">
            {movements.map((m) => (
              <div key={m.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${MOVEMENT_COLORS[m.movement_type] ?? ''}`}>
                    {m.movement_type === 'contraction' || m.movement_type === 'churn' ? '−' : '+'}
                    {fr.format.currency(Math.abs(m.amount_cents), currency)}
                  </span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {MOVEMENT_LABELS[m.movement_type] ?? m.movement_type}
                  </Badge>
                </div>
                <span className="text-muted-foreground">{fr.format.date(m.movement_date)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
