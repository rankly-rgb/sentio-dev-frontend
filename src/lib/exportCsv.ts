import { supabase } from '@/lib/supabase';

const CSV_COLUMNS = [
  'shopify_customer_id',
  'health_score',
  'emotional_score',
  'churn_risk_score',
  'lifetime_value',
  'total_orders',
  'rfm_recency_days',
  'heart_smart_segment',
  'is_subscriber',
  'subscription_status',
  'customer_segment',
  'purchase_pattern',
  'repurchase_probability',
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

export async function exportCustomersCsv(orgId: string): Promise<{ exported: number; total: number }> {
  // First get total count
  const { count, error: countError } = await supabase
    .from('customers')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId);

  if (countError) {
    throw new Error('Failed to count customers: ' + countError.message);
  }

  const total = count || 0;

  // Fetch up to MAX_EXPORT_ROWS
  const { data, error } = await supabase
    .from('customers')
    .select(CSV_COLUMNS.join(', '))
    .eq('organization_id', orgId)
    .order('health_score', { ascending: false })
    .limit(MAX_EXPORT_ROWS);

  if (error) {
    throw new Error('Failed to fetch customers: ' + error.message);
  }

  if (!data || data.length === 0) {
    throw new Error('No customers to export');
  }

  // Build CSV string
  const lines: string[] = [];
  lines.push(CSV_COLUMNS.join(','));

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const values: string[] = [];
    for (let j = 0; j < CSV_COLUMNS.length; j++) {
      values.push(escapeCsvValue((row as unknown as Record<string, unknown>)[CSV_COLUMNS[j]]));
    }
    lines.push(values.join(','));
  }

  const csvContent = lines.join('\n');

  // Trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const filename = 'jacin-customers-' + yyyy + '-' + mm + '-' + dd + '.csv';

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { exported: data.length, total: total };
}
