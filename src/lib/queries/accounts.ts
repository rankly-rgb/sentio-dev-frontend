import { supabase } from '@/lib/supabase';
import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';
import type { AccountListItem, AccountDetail, AccountSummaryCards, AccountPriorityLabel } from '@/lib/types/accounts';
import type { AccountFlag } from '@/types/database';

interface AccountsApiItem {
  id: string;
  stripe_customer_id: string;
  display_name: string | null;
  plan_tier: string | null;
  billing_interval: string | null;
  mrr_cents: number;
  seat_count: number | null;
  seat_limit: number | null;
  health_score: number | null;
  churn_risk_score: number | null;
  expansion_score: number | null;
  product_usage_score: number | null;
  contract_end_date: string | null;
  priority_label: AccountPriorityLabel | null;
  flags: AccountFlag[];
  created_at: string;
}

interface AccountsListResponse {
  data: AccountsApiItem[];
  pagination: { limit: number; next_cursor: string | null; has_more: boolean };
}

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
  cursor?: string | null;
  limit?: number;
  search?: string;
} = {}): Promise<{ data: AccountListItem[]; pagination: { next_cursor: string | null; has_more: boolean } }> {
  const qs = new URLSearchParams();
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.cursor) qs.set('cursor', params.cursor);
  if (params.search) qs.set('search', params.search);
  const path = qs.toString() ? `accounts-api?${qs}` : 'accounts-api';
  const res = await fetchWithUserJwt<AccountsListResponse>(path);
  const mapped = res.data.map(a => ({
    ...a,
    display_name: a.display_name ?? null,
    active_subscriptions: 0,
    segment_name: null,
    flags: Array.isArray(a.flags) ? a.flags : [],
  }));
  if (import.meta.env.DEV) {
    const dupeCount = mapped.length - new Set(mapped.map(a => a.stripe_customer_id)).size;
    if (dupeCount > 0) console.warn(`[sentio] accounts-api: ${dupeCount} duplicate stripe_customer_id(s) detected`);
  }
  const deduped = Array.from(new Map(mapped.map(a => [a.stripe_customer_id, a])).values());
  return {
    data: deduped,
    pagination: res.pagination,
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

  // Check errors individually (hubspot/segments can legitimately be empty)
  if (subsRes.error) throw new Error(`Error loading subscriptions: ${subsRes.error.message}`);
  if (invoicesRes.error) throw new Error(`Error loading invoices: ${invoicesRes.error.message}`);
  if (usageRes.error) throw new Error(`Error loading usage: ${usageRes.error.message}`);
  if (scoreRes.error) throw new Error(`Error loading score_history: ${scoreRes.error.message}`);
  if (hubspotRes.error) throw new Error(`Error loading hubspot: ${hubspotRes.error.message}`);
  if (segmentsRes.error) throw new Error(`Error loading segments: ${segmentsRes.error.message}`);

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
