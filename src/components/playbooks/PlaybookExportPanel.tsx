import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Braces, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useT } from '@/lib/i18n/useT';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { PRIORITY_OPTIONS, formatPriorityKey } from '@/lib/priority-labels';

interface ExportFilters {
  priority?: string;
  segment?: string;
  contract?: string;
}

interface ExportSummary {
  total_accounts: number;
  total_mrr_at_risk_cents: number;
  by_priority: Record<string, number>;
  by_segment: Record<string, number>;
}

interface PlaybookExportPanelProps {
  playbookId: string;
}

function useExportSummary(playbookId: string, filters: ExportFilters) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['playbook-export-summary', playbookId, filters],
    queryFn: async () => {
      const filterPayload: Record<string, unknown> = {};
      if (filters.priority && filters.priority !== 'all') filterPayload.priority = filters.priority;
      if (filters.segment && filters.segment !== 'all') filterPayload.segment = filters.segment;
      if (filters.contract && filters.contract !== 'all') filterPayload.contract = filters.contract;

      const { data, error } = await supabase.rpc('get_playbook_export_summary', {
        p_playbook_id: playbookId,
        p_filters: filterPayload,
      });
      if (error) throw error;
      return data as ExportSummary;
    },
    enabled: !!user?.organization_id,
    staleTime: 30_000,
  });
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function PlaybookExportPanel({ playbookId }: PlaybookExportPanelProps) {
  const fr = useT();
  const [filters, setFilters] = useState<ExportFilters>({});
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingJson, setExportingJson] = useState(false);

  const { data: summary, isLoading: summaryLoading } = useExportSummary(playbookId, filters);

  const segmentKeys = summary?.by_segment ? Object.keys(summary.by_segment) : [];

  const handleExport = useCallback(async (format: 'csv' | 'json') => {
    const setLoading = format === 'csv' ? setExportingCsv : setExportingJson;
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        playbook_id: playbookId,
        format,
      };
      if (filters.priority && filters.priority !== 'all') body.priority = filters.priority;
      if (filters.segment && filters.segment !== 'all') body.segment = filters.segment;
      if (filters.contract && filters.contract !== 'all') body.contract = filters.contract;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Session expir\u00e9e');

      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/export-playbook-accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData: { error?: string } = await res.json().catch(() => ({}));
        throw new Error(errData.error ?? `Erreur ${res.status}`);
      }

      const blob = await res.blob();
      const ext = format === 'csv' ? 'csv' : 'json';
      const today = new Date().toISOString().split('T')[0];
      triggerBlobDownload(blob, `export-playbook-${today}.${ext}`);

      const totalAccounts = summary?.total_accounts ?? 0;
      const mrrStr = fr.format.currency(summary?.total_mrr_at_risk_cents ?? 0);
      toast.success(fr.playbookExport.toastSuccess(totalAccounts, mrrStr));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur export');
    } finally {
      setLoading(false);
    }
  }, [playbookId, filters, summary, fr]);

  const updateFilter = (key: keyof ExportFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{fr.playbookExport.sectionTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        {summaryLoading ? (
          <div className="flex gap-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-6 w-40" />
          </div>
        ) : summary ? (
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">{fr.playbookExport.totalAccounts} : </span>
              <span className="font-semibold">{summary.total_accounts}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{fr.playbookExport.mrrAtRisk} : </span>
              <span className="font-semibold">{fr.format.currency(summary.total_mrr_at_risk_cents)}</span>
            </div>
            {summary.by_priority && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {Object.entries(summary.by_priority).map(([key, val]) => (
                  <span key={key}>{formatPriorityKey(key)} : {val}</span>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={filters.priority ?? 'all'} onValueChange={(v) => updateFilter('priority', v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={fr.playbookExport.filterPriority} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{fr.playbookExport.all}</SelectItem>
              {PRIORITY_OPTIONS.map(({ code, label }) => (
                <SelectItem key={code} value={code}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.segment ?? 'all'} onValueChange={(v) => updateFilter('segment', v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={fr.playbookExport.filterSegment} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{fr.playbookExport.all}</SelectItem>
              {segmentKeys.map((seg) => (
                <SelectItem key={seg} value={seg}>{seg}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.contract ?? 'all'} onValueChange={(v) => updateFilter('contract', v)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={fr.playbookExport.filterContract} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{fr.playbookExport.all}</SelectItem>
              <SelectItem value="monthly">{fr.playbookExport.monthly}</SelectItem>
              <SelectItem value="annual">{fr.playbookExport.annual}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Export buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => handleExport('csv')}
            disabled={exportingCsv || exportingJson}
          >
            {exportingCsv ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            {exportingCsv ? fr.playbookExport.exporting : fr.playbookExport.exportCsv}
          </Button>

          <Button
            variant="outline"
            onClick={() => handleExport('json')}
            disabled={exportingCsv || exportingJson}
          >
            {exportingJson ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Braces className="h-4 w-4 mr-2" />
            )}
            {exportingJson ? fr.playbookExport.exporting : fr.playbookExport.exportJson}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
