import { supabase } from '@/lib/supabase';
import type { AccountListItem, AccountDetail, AccountSummaryCards } from '@/lib/types/accounts';

export async function getAccountSummaryCards(): Promise<AccountSummaryCards> {
  const { data, error } = await supabase
    .from('accounts')
    .select('id, health_score, churn_risk_score, expansion_score, mrr_cents');

  if (error) throw error;

  const accounts = data || [];
  return {
    total_accounts: accounts.length,
    at_risk_accounts: accounts.filter(a => (a.churn_risk_score ?? 0) > 70).length,
    healthy_accounts: accounts.filter(a => (a.health_score ?? 0) > 60).length,
    expansion_ready: accounts.filter(a => (a.expansion_score ?? 0) > 75).length,
    total_mrr_cents: accounts.reduce((sum, a) => sum + (a.mrr_cents || 0), 0),
    mrr_at_risk_cents: accounts
      .filter(a => (a.churn_risk_score ?? 0) > 70)
      .reduce((sum, a) => sum + (a.mrr_cents || 0), 0),
  };
}

export async function getAccountList(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  segment?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
} = {}): Promise<{ data: AccountListItem[]; count: number }> {
  const {
    page = 1,
    pageSize = 25,
    search,
    sortBy = 'mrr_cents',
    sortOrder = 'desc',
  } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('accounts')
    .select(
      'id, stripe_customer_id, plan_tier, billing_interval, mrr_cents, seat_count, seat_limit, health_score, churn_risk_score, expansion_score, product_usage_score, contract_end_date',
      { count: 'exact' },
    );

  if (search) {
    query = query.ilike('stripe_customer_id', `%${search}%`);
  }

  query = query.order(sortBy, { ascending: sortOrder === 'asc' }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data: (data || []).map(a => ({ ...a, active_subscriptions: 0, segment_name: null })),
    count: count || 0,
  };
}

export async function getAccountDetail(accountId: string): Promise<AccountDetail | null> {
  const { data: account, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', accountId)
    .single();

  // PGRST116 = not found → legitimate null
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  if (!account) return null;

  const [subsRes, invoicesRes, usageRes, scoreRes, hubspotRes] = await Promise.all([
    supabase.from('subscriptions').select('*').eq('account_id', accountId).order('created_at', { ascending: false }),
    supabase.from('invoices').select('*').eq('account_id', accountId).order('invoice_date', { ascending: false }).limit(10),
    supabase.from('usage_events').select('event_type, feature_name, event_count, event_date').eq('account_id', accountId).order('event_date', { ascending: false }).limit(30),
    supabase.from('score_history').select('*').eq('account_id', accountId).order('snapshot_date', { ascending: false }).limit(30),
    supabase.from('hubspot_companies').select('*').eq('account_id', accountId).single(),
  ]);

  // Vérifier les erreurs individuellement (hubspot peut légitimement ne pas exister)
  if (subsRes.error) throw new Error(`Erreur chargement subscriptions: ${subsRes.error.message}`);
  if (invoicesRes.error) throw new Error(`Erreur chargement invoices: ${invoicesRes.error.message}`);
  if (usageRes.error) throw new Error(`Erreur chargement usage: ${usageRes.error.message}`);
  if (scoreRes.error) throw new Error(`Erreur chargement score_history: ${scoreRes.error.message}`);

  return {
    ...account,
    subscriptions: subsRes.data || [],
    recent_invoices: invoicesRes.data || [],
    recent_usage: usageRes.data || [],
    score_history: scoreRes.data || [],
    hubspot_data: hubspotRes.data || null,
  };
}
