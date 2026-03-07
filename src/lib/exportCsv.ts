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

function buildDateFilename(prefix: string): string {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${prefix}-${yyyy}-${mm}-${dd}.csv`;
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
