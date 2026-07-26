import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAccounts } from '@/hooks/useAccounts';
import { useAccountDetailPanel } from '@/hooks/useAccountDetailPanel';
import { exportCsvWithEmail } from '@/lib/exportCsv';
import { useT } from '@/lib/i18n/useT';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import ScoreBadge from '@/components/ScoreBadge';
import AccountName from '@/components/AccountName';
import AccountFlagsBadges from '@/components/accounts/AccountFlagsBadges';
import AccountPriorityBadge from '@/components/accounts/AccountPriorityBadge';
import AccountDetailPanel from '@/components/account-detail/AccountDetailPanel';
import { Search, Download, Flag, X } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import type { AccountPriorityLabel } from '@/lib/types/accounts';

export default function Accounts() {
  const fr = useT();
  const [search, setSearch] = useState('');
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([null]);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [flagsOnly, setFlagsOnly] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<AccountPriorityLabel | null>(null);
  const debouncedSearch = useDebounce(search, 300);
  const { isOpen, account: panelAccount, isLoading: panelLoading, openPanel, closePanel } = useAccountDetailPanel();
  const currentCursor = cursorStack[cursorStack.length - 1];

  const handleExport = useCallback(async () => {
    setExporting(true);
    setExportError(null);
    try {
      await exportCsvWithEmail({ limit: 2000 });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setExportError(msg);
      setTimeout(() => setExportError(null), 5000);
      toast.error(msg);
    } finally {
      setExporting(false);
    }
  }, []);

  const { accounts, nextCursor, hasMore, summary, isLoading, error, refetch } = useAccounts({
    cursor: currentCursor,
    search: debouncedSearch,
    limit: 25,
  });

  const filteredAccounts = accounts
    .filter(a => !flagsOnly || a.flags.length > 0)
    .filter(a => !priorityFilter || a.priority_label === priorityFilter);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{fr.accounts.title}</h1>
        <div className="flex flex-col items-end gap-1">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
            <Download className="h-4 w-4 mr-2" />
            {exporting ? fr.segmentDetail.exporting : fr.accounts.exportCsv}
          </Button>
          {exportError ? (
            <span className="text-[10px] text-destructive text-right max-w-[280px]">{exportError}</span>
          ) : (
            <span className="text-[10px] text-muted-foreground text-right max-w-[280px]">
              {fr.accounts.transitPiiNote}
            </span>
          )}
        </div>
      </div>

      {/* Cartes résumé */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card data-testid="kpi-active-accounts">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{fr.dashboard.totalAccounts}</p>
              <p className="text-2xl font-bold">{summary.total_accounts}</p>
            </CardContent>
          </Card>
          <Card data-testid="kpi-mrr">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{fr.dashboard.mrr}</p>
              <p className="text-2xl font-bold">{fr.format.currency(summary.total_mrr_cents)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{fr.dashboard.accountsAtRisk}</p>
              <p className="text-2xl font-bold text-destructive">{summary.at_risk_accounts}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{fr.dashboard.expansionOpportunities}</p>
              <p className="text-2xl font-bold text-success">{summary.expansion_ready}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bandeau Plans & Sièges non configurés */}
      {!isLoading && accounts.length > 0 && (() => {
        const nullCount = accounts.filter(a => a.plan_tier === null).length;
        return nullCount / accounts.length > 0.8;
      })() && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-800">
          <span>{fr.accounts.plansBannerText}</span>
          <span aria-hidden>→</span>
          <Link
            to="/settings?tab=plans-sieges"
            className="font-medium underline underline-offset-2 hover:text-blue-900"
          >
            {fr.accounts.plansBannerLink}
          </Link>
        </div>
      )}

      {/* Recherche + filtre flags */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder={fr.accounts.search}
            value={search}
            onChange={e => { setSearch(e.target.value); setCursorStack([null]); }}
          />
        </div>
        <Button
          variant={flagsOnly ? 'default' : 'outline'}
          size="sm"
          className="shrink-0"
          onClick={() => { setFlagsOnly(f => !f); setCursorStack([null]); }}
        >
          <Flag className="h-4 w-4 mr-1.5" />
          {fr.accounts.withFlags}
        </Button>
        {priorityFilter && (
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => setPriorityFilter(null)}
          >
            {fr.accountPriority[priorityFilter]}
            <X className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        )}
      </div>

      {/* Error state */}
      {error && !isLoading && (
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <p className="text-destructive mb-3">{fr.accounts.errorLoading}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              {fr.common.retry}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Stripe</TableHead>
                <TableHead>{fr.accounts.planTier}</TableHead>
                <TableHead>{fr.accounts.mrr}</TableHead>
                <TableHead>{fr.accounts.seats}</TableHead>
                <TableHead>{fr.accounts.healthScore}</TableHead>
                <TableHead>{fr.accounts.priorityColumn}</TableHead>
                <TableHead>{fr.accounts.churnRisk}</TableHead>
                <TableHead>{fr.accounts.flags}</TableHead>
                <TableHead>{fr.accounts.contractEnd}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    {fr.accounts.noAccounts}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAccounts.map(account => (
                  <TableRow
                    key={account.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openPanel(account.id)}
                  >
                    <TableCell className="text-sm">
                      <AccountName stripeId={account.stripe_customer_id} displayName={account.display_name} />
                    </TableCell>
                    <TableCell>
                      {account.plan_tier && <Badge variant="outline">{account.plan_tier}</Badge>}
                    </TableCell>
                    <TableCell className="font-medium">{fr.format.currency(account.mrr_cents)}</TableCell>
                    <TableCell>{account.seat_count ?? '-'} / {account.seat_limit ?? '-'}</TableCell>
                    <TableCell><ScoreBadge score={account.health_score} band={account.health_score_band} type="health" /></TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <AccountPriorityBadge
                        priority={account.priority_label}
                        onClick={setPriorityFilter}
                      />
                    </TableCell>
                    <TableCell><ScoreBadge score={account.churn_risk_score} band={account.churn_risk_band} type="churn" inverted /></TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <AccountFlagsBadges flags={account.flags} compact />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {account.contract_end_date ? fr.format.date(account.contract_end_date) : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={cursorStack.length <= 1}
          onClick={() => setCursorStack(s => s.slice(0, -1))}
        >
          {fr.common.previous}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasMore}
          onClick={() => { if (nextCursor) setCursorStack(s => [...s, nextCursor]); }}
        >
          {fr.common.next}
        </Button>
      </div>

      <AccountDetailPanel
        isOpen={isOpen}
        onClose={closePanel}
        account={panelAccount}
        isLoading={panelLoading}
      />
    </div>
  );
}
