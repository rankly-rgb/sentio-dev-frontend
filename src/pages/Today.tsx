import { useRef, useState, useMemo } from 'react';
import { CheckCircle, CalendarCheck, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fr } from '@/i18n/fr';
import { useTodayActions } from '@/hooks/useTodayActions';
import { getUniqueCategories } from '@/lib/types/today-actions';
import type { TodayActionsFilters } from '@/lib/types/today-actions';
import type { PriorityCode } from '@/lib/priority-labels';
import TodaySummaryBar from '@/components/today/TodaySummaryBar';
import TodayFilters from '@/components/today/TodayFilters';
import TodayPriorityGroup from '@/components/today/TodayPriorityGroup';
import EmptyState from '@/components/EmptyState';

function formatDateHeader(): string {
  const now = new Date();
  return now.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function Today() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<TodayActionsFilters>({});
  const { summary, playbooks, isLoading, error } = useTodayActions(filters);

  const p0Ref = useRef<HTMLDivElement>(null);
  const p1Ref = useRef<HTMLDivElement>(null);
  const p2Ref = useRef<HTMLDivElement>(null);

  const refMap = useMemo<Record<PriorityCode, React.RefObject<HTMLDivElement | null>>>(() => ({
    P0: p0Ref,
    P1: p1Ref,
    P2: p2Ref,
  }), []);

  const scrollTo = (priority: PriorityCode) => {
    refMap[priority].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const availableCategories = getUniqueCategories(playbooks);

  // Group actions by priority
  const actionsByPriority: Record<PriorityCode, NonNullable<typeof summary>['actions']> = {
    P0: [],
    P1: [],
    P2: [],
  };
  if (summary) {
    for (const action of summary.actions) {
      actionsByPriority[action.priority].push(action);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {fr.common.error} : {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <CalendarCheck className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">
            {fr.todayActions.pageTitle} — {formatDateHeader()}
          </h1>
        </div>
        {user?.full_name && (
          <p className="text-sm text-muted-foreground">
            {fr.today.greeting(user.full_name)}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          {fr.todayActions.actionCount(summary?.total ?? 0)}
        </p>
      </div>

      {/* Empty state */}
      {summary && summary.total === 0 && (
        <EmptyState
          icon={CheckCircle}
          title={fr.todayActions.noActions}
          description={fr.todayActions.noActionsDesc}
          actionLabel={fr.todayActions.viewDashboard}
          actionHref="/dashboard"
        />
      )}

      {/* Content */}
      {summary && summary.total > 0 && (
        <>
          {/* Summary cards */}
          <TodaySummaryBar summary={summary} onScrollTo={scrollTo} />

          {/* Filters */}
          <TodayFilters
            filters={filters}
            onFiltersChange={setFilters}
            availableCategories={availableCategories}
          />

          {/* Priority groups */}
          <div className="space-y-4">
            <div ref={p0Ref}>
              <TodayPriorityGroup
                priority="P0"
                actions={actionsByPriority.P0}
                defaultExpanded
              />
            </div>
            <div ref={p1Ref}>
              <TodayPriorityGroup
                priority="P1"
                actions={actionsByPriority.P1}
                defaultExpanded
              />
            </div>
            <div ref={p2Ref}>
              <TodayPriorityGroup
                priority="P2"
                actions={actionsByPriority.P2}
                defaultExpanded={false}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
