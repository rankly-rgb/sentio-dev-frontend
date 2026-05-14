import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Download, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import ScoreBadge from '@/components/ScoreBadge';
import { useT } from '@/lib/i18n/useT';
import { supabase } from '@/lib/supabase';
import type { SegmentType, SegmentAccount } from '@/lib/types/segments';
import { SEGMENT_LABELS, SEGMENT_COLORS } from '@/lib/types/segments';

type SortField = 'mrr_cents' | 'health_score' | 'churn_risk_score' | 'expansion_score' | 'plan_tier';
type SortOrder = 'asc' | 'desc';

const PAGE_SIZE = 50;

interface SegmentDetailViewProps {
  segment: SegmentType;
  accounts: SegmentAccount[];
  totalFetched: number;
  onAccountClick?: (accountId: string) => void;
}

function comparePlanTier(a: string | null, b: string | null): number {
  const order: Record<string, number> = { enterprise: 3, growth: 2, starter: 1 };
  return (order[a ?? ''] ?? 0) - (order[b ?? ''] ?? 0);
}

export default function SegmentDetailView({ segment, accounts, totalFetched, onAccountClick }: SegmentDetailViewProps) {
  const fr = useT();
  const [sortField, setSortField] = useState<SortField>('mrr_cents');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(0);
  const [exporting, setExporting] = useState(false);

  const colors = SEGMENT_COLORS[segment];

  const sorted = useMemo(() => {
    const arr = [...accounts];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'plan_tier') {
        cmp = comparePlanTier(a.plan_tier, b.plan_tier);
      } else {
        cmp = (a[sortField] ?? 0) - (b[sortField] ?? 0);
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [accounts, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageData = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const totalMrr = useMemo(() => accounts.reduce((s, a) => s + a.mrr_cents, 0), [accounts]);
  const avgHealth = useMemo(() => {
    const scores = accounts.filter((a) => a.health_score !== null).map((a) => a.health_score!);
    return scores.length > 0 ? Math.round(scores.reduce((s, h) => s + h, 0) / scores.length) : null;
  }, [accounts]);

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortOrder('desc');
      }
      setPage(0);
    },
    [sortField],
  );

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error(fr.auth.sessionExpired);
      }
      const baseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const res = await fetch(
        `${baseUrl}/functions/v1/export-segment-csv?segment=${encodeURIComponent(segment)}`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: `Erreur ${res.status}` }));
        throw new Error((body as { error?: string }).error ?? `Erreur ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `segment-${segment}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(fr.segmentDetail.exportError + ' : ' + message);
    } finally {
      setExporting(false);
    }
  }, [segment, fr]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown className="inline h-3 w-3 opacity-30" />;
    return sortOrder === 'asc' ? (
      <ChevronUp className="inline h-3 w-3" />
    ) : (
      <ChevronDown className="inline h-3 w-3" />
    );
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      className="px-3 py-2 text-left text-xs font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground whitespace-nowrap"
      onClick={() => handleSort(field)}
    >
      {children} <SortIcon field={field} />
    </th>
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/segments">{fr.segments.title}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{SEGMENT_LABELS[segment]}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{SEGMENT_LABELS[segment]}</h1>
            <Badge className={`${colors.bg} ${colors.text} border-0`}>{SEGMENT_LABELS[segment]}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {accounts.length} {fr.segmentDetail.accountCount} · MRR {fr.format.currency(totalMrr)} · {fr.segmentDetail.avgHealth} {avgHealth !== null ? avgHealth : '—'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
            <Download className="h-4 w-4 mr-1" />
            {exporting ? fr.segmentDetail.exporting : fr.segmentDetail.exportCsv}
          </Button>
          <span className="text-[10px] text-muted-foreground max-w-[240px] text-right">
            {fr.segmentDetail.zeroPiiNote}
          </span>
        </div>
      </div>

      {/* Bandeau si > 100 comptes */}
      {totalFetched > 100 && accounts.length >= 100 && (
        <Card>
          <CardContent className="py-3 text-sm text-muted-foreground">
            {fr.segmentDetail.truncatedBanner(accounts.length)}
          </CardContent>
        </Card>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">{fr.segmentDetail.accountCount}</p>
            <p className="text-2xl font-bold">{accounts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">MRR</p>
            <p className="text-2xl font-bold">{fr.format.currency(totalMrr)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">{fr.segmentDetail.avgHealth}</p>
            <p className="text-2xl font-bold">{avgHealth !== null ? avgHealth : '—'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">ID Stripe</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">ID HubSpot</th>
              <SortableHeader field="plan_tier">{fr.accounts.planTier}</SortableHeader>
              <SortableHeader field="mrr_cents">{fr.accounts.mrr}</SortableHeader>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">{fr.accounts.seats}</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">{fr.segmentDetail.renewal}</th>
              <SortableHeader field="health_score">{fr.accounts.healthScore}</SortableHeader>
              <SortableHeader field="churn_risk_score">{fr.accounts.churnRisk}</SortableHeader>
              <SortableHeader field="expansion_score">{fr.scores.expansionScore}</SortableHeader>
            </tr>
          </thead>
          <tbody>
            {pageData.map((a) => (
              <tr key={a.id} className="border-t hover:bg-muted/30">
                <td className="px-3 py-2 font-mono text-xs">
                  {onAccountClick ? (
                    <button
                      type="button"
                      onClick={() => onAccountClick(a.id)}
                      className="hover:underline text-primary text-left"
                    >
                      {a.stripe_customer_id}
                    </button>
                  ) : (
                    <Link to={`/accounts/${a.id}`} className="hover:underline text-primary">
                      {a.stripe_customer_id}
                    </Link>
                  )}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                  {a.hubspot_company_id ?? '—'}
                </td>
                <td className="px-3 py-2">
                  {a.plan_tier ? (
                    <span className="inline-flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">{a.plan_tier}</Badge>
                      {a.billing_interval && (
                        <span className="text-xs text-muted-foreground">{a.billing_interval === 'year' ? fr.accounts.annual : fr.accounts.monthly}</span>
                      )}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-3 py-2 font-medium">{fr.format.currency(a.mrr_cents)}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {a.seat_count !== null && a.seat_limit !== null
                    ? `${a.seat_count} / ${a.seat_limit}`
                    : a.seat_count !== null
                      ? String(a.seat_count)
                      : '—'}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {a.contract_end_date ? fr.format.date(a.contract_end_date) : fr.accounts.monthly}
                </td>
                <td className="px-3 py-2">
                  <ScoreBadge score={a.health_score} />
                </td>
                <td className="px-3 py-2">
                  <ScoreBadge score={a.churn_risk_score} inverted />
                </td>
                <td className="px-3 py-2">
                  <ExpansionBadge score={a.expansion_score} />
                </td>
              </tr>
            ))}
            {pageData.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">
                  {fr.segmentDetail.noAccounts}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            {fr.common.previous}
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} {fr.common.of} {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
            {fr.common.next}
          </Button>
        </div>
      )}
    </div>
  );
}

function ExpansionBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-muted-foreground">-</span>;
  const color = score >= 75 ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground';
  return (
    <Badge variant="outline" className={`font-semibold border-0 ${color}`}>
      {Math.round(score)}
    </Badge>
  );
}
