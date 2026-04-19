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

  const buildQuery = (cols: string) => {
    let q = supabase.from('accounts').select(cols, { count: 'exact' });
    if (search) q = q.ilike('stripe_customer_id', `%${search}%`);
    return q.order(sortBy, { ascending: sortOrder === 'asc' }).range(from, to);
  };

  let res = await buildQuery(
    'id, stripe_customer_id, display_name, plan_tier, billing_interval, mrr_cents, seat_count, seat_limit, health_score, churn_risk_score, expansion_score, product_usage_score, contract_end_date, flags',
  );

  // Graceful fallback if display_name column doesn't exist in the database yet
  if (res.error && res.error.message?.includes('display_name')) {
    res = await buildQuery(
      'id, stripe_customer_id, plan_tier, billing_interval, mrr_cents, seat_count, seat_limit, health_score, churn_risk_score, expansion_score, product_usage_score, contract_end_date, flags',
    );
  }

  if (res.error) throw res.error;

  return {
    data: (res.data || []).map(a => ({
      ...a,
      display_name: (a as { display_name?: string | null }).display_name ?? null,
      active_subscriptions: 0,
      segment_name: null,
      flags: Array.isArray(a.flags) ? a.flags : [],
    })),
    count: res.count || 0,
  };
}

export async function getAccountDetail(accountId: string): Promise<AccountDetail | null> {
  const { data: account, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', accountId)
    .maybeSingle();

  if (error) throw error;
  if (!account) return null;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  const [subsRes, invoicesRes, usageRes, scoreRes, hubspotRes, segmentsRes] = await Promise.all([
    supabase.from('subscriptions').select('*').eq('account_id', accountId).order('created_at', { ascending: false }),
    supabase.from('invoices').select('*').eq('account_id', accountId).order('invoice_date', { ascending: false }).limit(50),
    supabase
      .from('usage_events')
      .select('event_type, feature_name, event_count, event_date')
      .eq('account_id', accountId)
      .gte('event_date', thirtyDaysAgo)
      .order('event_date', { ascending: false })
      .limit(500),
    supabase
      .from('score_history')
      .select('snapshot_date, health_score, churn_risk_score, expansion_score, product_usage_score, financial_score, engagement_score, contract_score, mrr_cents')
      .eq('account_id', accountId)
      .order('snapshot_date', { ascending: false })
      .limit(90),
    supabase.from('hubspot_companies').select('*').eq('account_id', accountId).maybeSingle(),
    supabase
      .from('segment_memberships')
      .select('segment_id, status, risk_score, last_evaluated_at, account_segments(segment_name, segment_type, priority)')
      .eq('account_id', accountId)
      .eq('status', 'active'),
  ]);

  // Vérifier les erreurs individuellement (hubspot/segments peuvent légitimement être vides)
  if (subsRes.error) throw new Error(`Erreur chargement subscriptions: ${subsRes.error.message}`);
  if (invoicesRes.error) throw new Error(`Erreur chargement invoices: ${invoicesRes.error.message}`);
  if (usageRes.error) throw new Error(`Erreur chargement usage: ${usageRes.error.message}`);
  if (scoreRes.error) throw new Error(`Erreur chargement score_history: ${scoreRes.error.message}`);
  if (hubspotRes.error) throw new Error(`Erreur chargement hubspot: ${hubspotRes.error.message}`);
  if (segmentsRes.error) throw new Error(`Erreur chargement segments: ${segmentsRes.error.message}`);

  return {
    ...account,
    display_name: (account as { display_name?: string | null }).display_name ?? null,
    health_score_is_new: (account as { health_score_is_new?: boolean }).health_score_is_new ?? false,
    financial_score_narrative: (account as { financial_score_narrative?: string | null }).financial_score_narrative ?? null,
    engagement_score_narrative: (account as { engagement_score_narrative?: string | null }).engagement_score_narrative ?? null,
    contract_score_narrative: (account as { contract_score_narrative?: string | null }).contract_score_narrative ?? null,
    product_usage_score_narrative: (account as { product_usage_score_narrative?: string | null }).product_usage_score_narrative ?? null,
    flags: Array.isArray(account.flags) ? account.flags : [],
    subscriptions: subsRes.data || [],
    recent_invoices: invoicesRes.data || [],
    recent_usage: usageRes.data || [],
    score_history: scoreRes.data || [],
    hubspot_data: hubspotRes.data ?? null,
    segments: (segmentsRes.data || []).map((s) => ({
      segment_id: s.segment_id as string,
      status: s.status as 'active' | 'exited' | 'paused',
      risk_score: s.risk_score as number | null,
      last_evaluated_at: s.last_evaluated_at as string,
      account_segments: Array.isArray(s.account_segments) ? s.account_segments[0] : s.account_segments,
    })) as AccountDetail['segments'],
  };
}
