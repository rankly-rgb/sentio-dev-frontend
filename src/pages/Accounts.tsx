import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccounts } from '@/hooks/useAccounts';
import { fr } from '@/i18n/fr';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import ScoreBadge from '@/components/ScoreBadge';
import { Search, Download } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

export default function Accounts() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);
  const navigate = useNavigate();

  const { accounts, totalCount, summary, isLoading } = useAccounts({
    page,
    search: debouncedSearch,
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{fr.accounts.title}</h1>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          {fr.accounts.exportCsv}
        </Button>
      </div>

      {/* Cartes résumé */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{fr.dashboard.activeAccounts}</p>
              <p className="text-2xl font-bold">{summary.total_accounts}</p>
            </CardContent>
          </Card>
          <Card>
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

      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-10"
          placeholder={fr.accounts.search}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

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
                <TableHead>{fr.accounts.churnRisk}</TableHead>
                <TableHead>{fr.accounts.contractEnd}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {fr.accounts.noAccounts}
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map(account => (
                  <TableRow
                    key={account.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/accounts/${account.id}`)}
                  >
                    <TableCell className="font-mono text-sm">{account.stripe_customer_id}</TableCell>
                    <TableCell>
                      {account.plan_tier && <Badge variant="outline">{account.plan_tier}</Badge>}
                    </TableCell>
                    <TableCell className="font-medium">{fr.format.currency(account.mrr_cents)}</TableCell>
                    <TableCell>{account.seat_count ?? '-'} / {account.seat_limit ?? '-'}</TableCell>
                    <TableCell><ScoreBadge score={account.health_score} /></TableCell>
                    <TableCell><ScoreBadge score={account.churn_risk_score} inverted /></TableCell>
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
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {fr.common.showing} {(page - 1) * 25 + 1}-{Math.min(page * 25, totalCount)} {fr.common.of} {totalCount}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            {fr.common.previous}
          </Button>
          <Button variant="outline" size="sm" disabled={page * 25 >= totalCount} onClick={() => setPage(p => p + 1)}>
            {fr.common.next}
          </Button>
        </div>
      </div>
    </div>
  );
}
