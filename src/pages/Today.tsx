import { useRef, useState, useMemo, useCallback } from 'react';
import { CalendarCheck, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useT } from '@/lib/i18n/useT';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { supabase } from '@/lib/supabase';
import { useTodayActions } from '@/hooks/useTodayActions';
import { useAccountDetailPanel } from '@/hooks/useAccountDetailPanel';
import { getUniqueCategories } from '@/lib/types/today-actions';
import type { TodayActionsFilters } from '@/lib/types/today-actions';
import type { PriorityCode } from '@/lib/priority-labels';
import { Button } from '@/components/ui/button';
import TodaySummaryBar from '@/components/today/TodaySummaryBar';
import TodayFilters from '@/components/today/TodayFilters';
import TodayPriorityGroup from '@/components/today/TodayPriorityGroup';
import DailyBriefing from '@/components/today/DailyBriefing';
import TodayHeroCard from '@/components/today/TodayHeroCard';
import WeeklyWins from '@/components/today/WeeklyWins';
import AccountDetailPanel from '@/components/account-detail/AccountDetailPanel';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

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
  const fr = useT();
  const { user } = useAuth();
  const [filters, setFilters] = useState<TodayActionsFilters>({});
  const [exporting, setExporting] = useState(false);
  const { summary, accounts, playbooks, isLoading, error } = useTodayActions(filters);
  const { isOpen, account: panelAccount, isLoading: panelLoading, openPanel, closePanel } = useAccountDetailPanel();

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

  const exportCsv = useCallback(async () => {
    setExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Session expirée');

      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/export-playbook-accounts`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ format: 'csv' }),
        },
      );

      if (!res.ok) throw new Error(`Erreur ${res.status}`);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `actions-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur export');
    } finally {
      setExporting(false);
    }
  }, []);

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
      <div className="flex items-start justify-between gap-3">
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
        <LanguageSwitcher />
      </div>

      {/* Daily briefing — always shown */}
      <DailyBriefing />

      {/* Hero card — always shown, never an empty state */}
      <TodayHeroCard accounts={accounts} p0InsightsCount={summary?.by_priority.P0 ?? 0} />

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
                onAccountClick={openPanel}
              />
            </div>
            <div ref={p1Ref}>
              <TodayPriorityGroup
                priority="P1"
                actions={actionsByPriority.P1}
                defaultExpanded
                onAccountClick={openPanel}
              />
            </div>
            <div ref={p2Ref}>
              <TodayPriorityGroup
                priority="P2"
                actions={actionsByPriority.P2}
                defaultExpanded={false}
                onAccountClick={openPanel}
              />
            </div>
          </div>

          {/* Weekly wins */}
          <WeeklyWins />

          {/* Export */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={exporting}
              onClick={exportCsv}
              className="gap-2"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {fr.todayActions.exportCsv}
            </Button>
          </div>
        </>
      )}

      <AccountDetailPanel
        isOpen={isOpen}
        onClose={closePanel}
        account={panelAccount}
        isLoading={panelLoading}
      />
    </div>
  );
}
