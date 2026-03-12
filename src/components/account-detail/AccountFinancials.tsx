import { fr } from '@/i18n/fr';
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

function computeInvoiceTotals(invoices: InvoiceItem[]) {
  let paid = 0;
  let paidCount = 0;
  let due = 0;
  let dueCount = 0;
  let overdue = 0;
  let overdueCount = 0;
  const now = new Date().toISOString().split('T')[0];

  for (const inv of invoices) {
    if (inv.status === 'paid') {
      paid += inv.amount_cents;
      paidCount++;
    } else if (inv.status === 'open') {
      if (inv.due_date && inv.due_date < now) {
        overdue += inv.amount_cents;
        overdueCount++;
      } else {
        due += inv.amount_cents;
        dueCount++;
      }
    }
  }

  return { paid, paidCount, due, dueCount, overdue, overdueCount, total: paid + due + overdue };
}

const MOVEMENT_LABELS: Record<string, string> = {
  new: fr.mrr.new,
  expansion: fr.mrr.expansion,
  contraction: fr.mrr.contraction,
  churn: fr.mrr.churn,
  reactivation: fr.mrr.reactivation,
};

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
  const { data: movements, isLoading: movementsLoading } = useMrrMovements(account.id);
  const invoiceTotals = computeInvoiceTotals(account.recent_invoices);

  return (
    <div className="space-y-4">
      {/* MRR / ARR / Seats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs text-muted-foreground">MRR</p>
          <p className="text-sm font-bold">{fr.format.currency(account.mrr_cents)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">ARR</p>
          <p className="text-sm font-bold">{fr.format.currency(account.arr_cents)}</p>
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
            {invoiceTotals.overdue > 0 && (
              <div
                className="bg-red-500 h-full"
                style={{ width: `${(invoiceTotals.overdue / invoiceTotals.total) * 100}%` }}
              />
            )}
          </div>
          <div className="flex gap-3 text-[11px] text-muted-foreground flex-wrap">
            <span>
              <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-1" />
              Payé : {fr.format.currency(invoiceTotals.paid)} ({invoiceTotals.paidCount})
            </span>
            <span>
              <span className="inline-block h-2 w-2 rounded-full bg-yellow-400 mr-1" />
              Dû : {fr.format.currency(invoiceTotals.due)} ({invoiceTotals.dueCount})
            </span>
            {invoiceTotals.overdue > 0 && (
              <span>
                <span className="inline-block h-2 w-2 rounded-full bg-red-500 mr-1" />
                En retard : {fr.format.currency(invoiceTotals.overdue)} ({invoiceTotals.overdueCount})
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
                    {fr.format.currency(Math.abs(m.amount_cents))}
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
