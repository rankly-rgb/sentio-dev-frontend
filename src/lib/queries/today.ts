import { supabase } from '@/lib/supabase';
import type { Invoice } from '@/types/database';

/** Compte enrichi pour la vue briefing quotidien */
export interface TodayAccount {
  id: string;
  stripe_customer_id: string;
  plan_tier: string | null;
  billing_interval: string | null;
  mrr_cents: number;
  seat_count: number | null;
  seat_limit: number | null;
  health_score: number | null;
  churn_risk_score: number | null;
  expansion_score: number | null;
  product_usage_score: number | null;
  financial_score: number | null;
  engagement_score: number | null;
  contract_score: number | null;
  contract_end_date: string | null;
  scores_calculated_at: string | null;
  overdue_invoices: OverdueInvoice[];
  health_score_30d_ago: number | null;
}

interface OverdueInvoice {
  id: string;
  amount_cents: number;
  status: Invoice['status'];
  due_date: string | null;
  invoice_date: string;
}

/** Colonnes selectionnees dans les requetes accounts */
interface AccountRow {
  id: string;
  stripe_customer_id: string;
  plan_tier: string | null;
  billing_interval: string | null;
  mrr_cents: number;
  seat_count: number | null;
  seat_limit: number | null;
  health_score: number | null;
  churn_risk_score: number | null;
  expansion_score: number | null;
  product_usage_score: number | null;
  financial_score: number | null;
  engagement_score: number | null;
  contract_score: number | null;
  contract_end_date: string | null;
  scores_calculated_at: string | null;
}

const ACCOUNT_COLUMNS = [
  'id', 'stripe_customer_id', 'plan_tier', 'billing_interval',
  'mrr_cents', 'seat_count', 'seat_limit',
  'health_score', 'churn_risk_score', 'expansion_score',
  'product_usage_score', 'financial_score', 'engagement_score', 'contract_score',
  'contract_end_date', 'scores_calculated_at',
].join(', ');

interface InvoiceRow {
  id: string;
  account_id: string;
  amount_cents: number;
  status: string;
  due_date: string | null;
  invoice_date: string;
}

interface ScoreRow {
  account_id: string;
  health_score: number | null;
  snapshot_date: string;
}

async function enrichWithInvoicesAndHistory(
  accounts: AccountRow[],
): Promise<TodayAccount[]> {
  if (accounts.length === 0) return [];

  const ids = accounts.map(a => a.id);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  const [invoicesRes, historyRes] = await Promise.all([
    supabase
      .from('invoices')
      .select('id, account_id, amount_cents, status, due_date, invoice_date')
      .in('account_id', ids)
      .in('status', ['open', 'draft']),
    supabase
      .from('score_history')
      .select('account_id, health_score, snapshot_date')
      .in('account_id', ids)
      .lte('snapshot_date', thirtyDaysAgo)
      .order('snapshot_date', { ascending: false }),
  ]);

  const invoicesByAccount = new Map<string, OverdueInvoice[]>();
  for (const raw of (invoicesRes.data ?? []) as unknown as InvoiceRow[]) {
    const list = invoicesByAccount.get(raw.account_id) ?? [];
    list.push({
      id: raw.id,
      amount_cents: raw.amount_cents,
      status: raw.status as Invoice['status'],
      due_date: raw.due_date,
      invoice_date: raw.invoice_date,
    });
    invoicesByAccount.set(raw.account_id, list);
  }

  const historyByAccount = new Map<string, number>();
  for (const raw of (historyRes.data ?? []) as unknown as ScoreRow[]) {
    if (!historyByAccount.has(raw.account_id) && raw.health_score != null) {
      historyByAccount.set(raw.account_id, raw.health_score);
    }
  }

  return accounts.map(a => ({
    ...a,
    overdue_invoices: invoicesByAccount.get(a.id) ?? [],
    health_score_30d_ago: historyByAccount.get(a.id) ?? null,
  }));
}

/** P0 : churn_risk > 70 */
export async function getCriticalAccounts(orgId: string): Promise<TodayAccount[]> {
  const { data, error } = await supabase
    .from('accounts')
    .select(ACCOUNT_COLUMNS)
    .eq('organization_id', orgId)
    .gt('churn_risk_score', 70)
    .order('churn_risk_score', { ascending: false });

  if (error) throw error;
  return enrichWithInvoicesAndHistory((data ?? []) as unknown as AccountRow[]);
}

/** P1 : churn_risk 50-70 OU health_score 40-60 */
export async function getAtRiskAccounts(orgId: string): Promise<TodayAccount[]> {
  const [churnRes, healthRes] = await Promise.all([
    supabase
      .from('accounts')
      .select(ACCOUNT_COLUMNS)
      .eq('organization_id', orgId)
      .gte('churn_risk_score', 50)
      .lte('churn_risk_score', 70)
      .order('churn_risk_score', { ascending: false }),
    supabase
      .from('accounts')
      .select(ACCOUNT_COLUMNS)
      .eq('organization_id', orgId)
      .gte('health_score', 40)
      .lte('health_score', 60)
      .order('health_score', { ascending: true }),
  ]);

  if (churnRes.error) throw churnRes.error;
  if (healthRes.error) throw healthRes.error;

  const allRows = [
    ...((churnRes.data ?? []) as unknown as AccountRow[]),
    ...((healthRes.data ?? []) as unknown as AccountRow[]),
  ];

  const seen = new Set<string>();
  const merged: AccountRow[] = [];
  for (const a of allRows) {
    if (!seen.has(a.id)) {
      seen.add(a.id);
      merged.push(a);
    }
  }

  // Exclude accounts already in P0 (churn_risk > 70)
  const filtered = merged.filter(a => (a.churn_risk_score ?? 0) <= 70);

  return enrichWithInvoicesAndHistory(filtered);
}

/** Expansion : expansion_score > 75 */
export async function getExpansionAccounts(orgId: string): Promise<TodayAccount[]> {
  const { data, error } = await supabase
    .from('accounts')
    .select(ACCOUNT_COLUMNS)
    .eq('organization_id', orgId)
    .gt('expansion_score', 75)
    .order('expansion_score', { ascending: false });

  if (error) throw error;
  return enrichWithInvoicesAndHistory((data ?? []) as unknown as AccountRow[]);
}

/** Prochain renouvellement (pour l'etat vide) */
export async function getNextRenewalDays(orgId: string): Promise<number | null> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('accounts')
    .select('contract_end_date')
    .eq('organization_id', orgId)
    .gt('contract_end_date', today)
    .order('contract_end_date', { ascending: true })
    .limit(1);

  if (error || !data || data.length === 0) return null;
  const row = data[0] as unknown as { contract_end_date: string };
  const endDate = new Date(row.contract_end_date);
  const diffMs = endDate.getTime() - Date.now();
  return Math.ceil(diffMs / 86400000);
}
