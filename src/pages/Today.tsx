import { Skeleton } from '@/components/ui/skeleton';
import { fr } from '@/i18n/fr';
import { useTodayP0, useTodayP1, useTodayExpansion } from '@/hooks/useToday';
import TodaySummaryHeader from '@/components/today/TodaySummaryHeader';
import AccountAlertCard from '@/components/today/AccountAlertCard';
import ExpansionCard from '@/components/today/ExpansionCard';
import EmptyTodayState from '@/components/today/EmptyTodayState';

export default function Today() {
  const { data: p0 = [], isLoading: p0Loading } = useTodayP0();
  const { data: p1 = [], isLoading: p1Loading } = useTodayP1();
  const { data: expansion = [], isLoading: expLoading } = useTodayExpansion();

  const isLoading = p0Loading || p1Loading || expLoading;
  const hasNoActions = !isLoading && p0.length === 0 && p1.length === 0 && expansion.length === 0;

  return (
    <div className="space-y-8 p-6">
      <TodaySummaryHeader p0Count={p0.length} />

      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      )}

      {hasNoActions && <EmptyTodayState />}

      {/* Section P0 */}
      {p0.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-red-700">
            {fr.today.sectionP0}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {p0.map(account => (
              <AccountAlertCard key={account.id} account={account} level="p0" />
            ))}
          </div>
        </section>
      )}

      {/* Section P1 */}
      {p1.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-orange-700">
            {fr.today.sectionP1}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {p1.map(account => (
              <AccountAlertCard key={account.id} account={account} level="p1" maxSignals={2} />
            ))}
          </div>
        </section>
      )}

      {/* Section Expansion */}
      {expansion.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-emerald-700">
            {fr.today.sectionExpansion}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {expansion.map(account => (
              <ExpansionCard key={account.id} account={account} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
