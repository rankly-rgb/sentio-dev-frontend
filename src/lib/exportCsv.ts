import { supabase } from '@/lib/supabase';

const ACCOUNT_CSV_HEADER = [
  'stripe_customer_id',
  'hubspot_company_id',
  'plan_tier',
  'billing_interval',
  'mrr_eur',
  'seat_count',
  'seat_limit',
  'contract_end_date',
  'health_score',
  'churn_risk_score',
  'expansion_score',
  'product_usage_score',
];

const MAX_EXPORT_ROWS = 5000;

function escapeCsvValue(value: unknown): string {
  if (value == null) return '';
  const str = String(value);
  if (str.indexOf(',') >= 0 || str.indexOf('"') >= 0 || str.indexOf('\n') >= 0) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function triggerDownload(csvContent: string, filename: string): void {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function buildDateFilename(prefix: string, ext: '.csv' | '.txt' = '.csv'): string {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${prefix}-${yyyy}-${mm}-${dd}${ext}`;
}

interface AccountCsvRow {
  stripe_customer_id: string;
  hubspot_company_id: string | null;
  plan_tier: string | null;
  billing_interval: string | null;
  mrr_cents: number;
  seat_count: number | null;
  seat_limit: number | null;
  contract_end_date: string | null;
  health_score: number | null;
  churn_risk_score: number | null;
  expansion_score: number | null;
  product_usage_score: number | null;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const EXPORT_TIMEOUT_MS = 60_000;

export interface ExportCsvOptions {
  include_email?: boolean;
  limit?: number;
  segment_id?: string;
  filters?: {
    min_churn_risk?: number;
    min_mrr_cents?: number;
    max_health_score?: number;
  };
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportCsvWithEmail(options: ExportCsvOptions = {}): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Session expirée, veuillez vous reconnecter');

  const body: ExportCsvOptions = { include_email: true, limit: 2000, ...options };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), EXPORT_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${SUPABASE_URL}/functions/v1/export-csv`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error("L'export a pris trop de temps, veuillez réessayer avec un périmètre plus petit");
    }
    throw new Error('Erreur réseau — vérifiez votre connexion');
  }
  clearTimeout(timeoutId);

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `Erreur ${res.status}` }));
    throw new Error((body as { error?: string }).error ?? `Erreur ${res.status}`);
  }

  const blob = await res.blob();
  triggerBlobDownload(blob, buildDateFilename('sentio-export'));
}

export async function exportSequenceTemplate(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Session expirée, veuillez vous reconnecter');

  const res = await fetch(`${SUPABASE_URL}/functions/v1/export-csv?format=sequence_template`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (!res.ok) throw new Error(`Erreur ${res.status}`);

  const blob = await res.blob();
  triggerBlobDownload(blob, buildDateFilename('sentio-sequence', '.txt'));
}

export async function exportAccountsCsv(): Promise<{ exported: number }> {
  const { data, error } = await supabase
    .from('accounts')
    .select('stripe_customer_id, hubspot_company_id, plan_tier, billing_interval, mrr_cents, seat_count, seat_limit, contract_end_date, health_score, churn_risk_score, expansion_score, product_usage_score')
    .order('mrr_cents', { ascending: false })
    .limit(MAX_EXPORT_ROWS);

  if (error) throw new Error('Erreur export : ' + error.message);
  if (!data || data.length === 0) throw new Error('Aucun compte à exporter');

  const rows = data as unknown[] as AccountCsvRow[];
  const lines: string[] = [];
  lines.push(ACCOUNT_CSV_HEADER.join(','));

  for (const row of rows) {
    lines.push([
      escapeCsvValue(row.stripe_customer_id),
      escapeCsvValue(row.hubspot_company_id),
      escapeCsvValue(row.plan_tier),
      escapeCsvValue(row.billing_interval),
      escapeCsvValue((row.mrr_cents / 100).toFixed(2)),
      escapeCsvValue(row.seat_count),
      escapeCsvValue(row.seat_limit),
      escapeCsvValue(row.contract_end_date),
      escapeCsvValue(row.health_score),
      escapeCsvValue(row.churn_risk_score),
      escapeCsvValue(row.expansion_score),
      escapeCsvValue(row.product_usage_score),
    ].join(','));
  }

  triggerDownload(lines.join('\n'), buildDateFilename('sentio-comptes'));
  return { exported: data.length };
}
