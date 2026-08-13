import { supabase } from '@/lib/supabase';
import { fetchWithUserJwt } from '@/lib/fetchWithUserJwt';
import { getPortfolioMetrics } from '@/lib/queries/portfolio-metrics';
import type {
  AccountListItem,
  AccountDetail,
  AccountSummaryCards,
  AccountPriorityLabel,
  ScoringV2Fields,
  ScoreBreakdown,
  SegmentType,
  HealthScoreStatus,
  HealthScoreBand,
  ChurnRiskBand,
  ExpansionScoreStatus,
  ExpansionUnavailableReason,
  TrendDirection,
  MrrStatus,
} from '@/lib/types/accounts';
import type { AccountFlag } from '@/types/database';

interface AccountsApiItem extends ScoringV2Fields {
  id: string;
  stripe_customer_id: string;
  display_name: string | null;
  plan_tier: string | null;
  billing_interval: string | null;
  mrr_cents: number;
  mrr_status: MrrStatus;
  is_delinquent: boolean;
  delinquent_since: string | null;
  seat_count: number | null;
  seat_limit: number | null;
  contract_end_date: string | null;
  priority_label: AccountPriorityLabel | null;
  flags: AccountFlag[];
  created_at: string;
}

interface AccountsListResponse {
  data: AccountsApiItem[];
  pagination: { limit: number; next_cursor: string | null; has_more: boolean };
  total_count: number;
  total_mrr_cents: number;
}

/**
 * Shape réelle de `GET accounts-api?id=` (payload v3), confirmée via
 * docs/reference/accounts-api-fixtures.test — extraite des `expect()` sur
 * handleGetOne (3 fixtures complete/partial/insufficient), PAS une
 * hypothèse. Les scores sont imbriqués sous `scores.<dimension>`, pas plats
 * sur `data` (contrairement à l'hypothèse initiale par analogie avec le
 * §2/§7 du contrat, qui décrit les colonnes DB, pas la forme JSON exposée).
 *
 * `scores.churn_risk.signals_triggered/signals_evaluated` : placement NON
 * confirmé par une assertion du fichier de fixtures (aucun `expect()` ne
 * les couvre) — non repris ici. `risk_signals_triggered`/`risk_signals_evaluated`
 * sont sourcés depuis `score_history` à la place (voir getAccountDetail),
 * dont la forme plate EST confirmée par un exemple JSON complet dans
 * docs/SCORING_ENGINE_CONTRACT.md §7.
 *
 * `usage_frozen_v2`/`engagement_frozen_v2` retirés : absents des fixtures,
 * non consommés par l'UI (cartes "Coming in V2" statiques, F3) — surface
 * non vérifiée inutile.
 */
interface AccountsApiScoreValue {
  value: number | null;
}

interface AccountsApiHealthScore {
  value: number | null;
  status: HealthScoreStatus;
  band: HealthScoreBand | null;
  max_points: number;
  trend_30d: TrendDirection;
}

interface AccountsApiChurnRisk {
  value: number;
  band: ChurnRiskBand;
}

interface AccountsApiExpansion {
  value: number | null;
  status: ExpansionScoreStatus;
  unavailable_reason: ExpansionUnavailableReason | null;
}

interface AccountsApiScores {
  health: AccountsApiHealthScore;
  payment_health: AccountsApiScoreValue;
  revenue_dynamics: AccountsApiScoreValue;
  contract_renewal: AccountsApiScoreValue;
  churn_risk: AccountsApiChurnRisk;
  expansion: AccountsApiExpansion;
}

interface AccountsApiDetailItem {
  id: string;
  organization_id: string;
  stripe_customer_id: string;
  display_name: string | null;
  hubspot_company_id: string | null;
  plan_tier: string | null;
  billing_interval: string | null;
  mrr_cents: number;
  mrr_status: MrrStatus;
  is_delinquent: boolean;
  delinquent_since: string | null;
  arr_cents: number;
  seat_count: number | null;
  seat_limit: number | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
  primary_segment: SegmentType | null;
  scores: AccountsApiScores;
  score_breakdown: ScoreBreakdown;
  scores_calculated_at: string | null;
  health_score_is_new?: boolean;
  last_stripe_sync_at: string | null;
  last_hubspot_sync_at: string | null;
  flags: AccountFlag[];
  created_at: string;
}

// at_risk_accounts/expansion_ready/total_mrr_cents/mrr_at_risk_cents viennent
// de portfolio-metrics (Phase 4 backend) — AUDIT_LOGIQUE_METIER_STRIPE.md
// point 22 identifiait cette fonction comme une 3e réimplémentation locale de
// ces agrégats, avec des seuils divergents des deux autres. total_accounts/
// healthy_accounts n'ont pas d'équivalent dans portfolio-metrics (pas des
// agrégats dupliqués ailleurs dans l'app) — comptages simples conservés ici.
export async function getAccountSummaryCards(): Promise<AccountSummaryCards> {
  const [portfolioMetrics, accountsRes] = await Promise.all([
    getPortfolioMetrics(),
    supabase.from('accounts').select('health_score, health_score_status'),
  ]);

  if (accountsRes.error) throw accountsRes.error;

  const accounts = (accountsRes.data || []) as Array<{
    health_score: number | null;
    health_score_status: 'complete' | 'partial' | 'insufficient';
  }>;

  return {
    total_accounts: accounts.length,
    at_risk_accounts: portfolioMetrics.accounts_at_risk,
    healthy_accounts: accounts.filter(a => a.health_score_status !== 'insufficient' && (a.health_score ?? 0) > 60).length,
    expansion_ready: portfolioMetrics.expansion_opportunities,
    total_mrr_cents: portfolioMetrics.mrr_cents,
    mrr_at_risk_cents: portfolioMetrics.mrr_at_risk_cents,
    currency: portfolioMetrics.currency,
  };
}

export async function getAccountList(params: {
  cursor?: string | null;
  limit?: number;
  search?: string;
} = {}): Promise<{
  data: AccountListItem[];
  pagination: { next_cursor: string | null; has_more: boolean };
  total_count: number;
  total_mrr_cents: number;
}> {
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
    total_count: res.total_count,
    total_mrr_cents: res.total_mrr_cents,
  };
}

/**
 * Charge tous les comptes de l'org via accounts-api (paginé), en réutilisant
 * getAccountList. Sert aux agrégations org-wide (segments, distribution
 * santé) qui ont besoin de `primary_segment` — champ confirmé disponible
 * via accounts-api (docs/reference/accounts-api-fixtures.test), contrairement
 * à un accès direct à la table `accounts` en PostgREST dont on ne sait pas
 * s'il expose cette colonne (question ouverte côté backend, voir rapport de
 * fin). Route ces lectures via l'edge function plutôt que de parier dessus.
 */
export async function getAllAccountsForOrg(): Promise<AccountListItem[]> {
  const all: AccountListItem[] = [];
  let cursor: string | null = null;
  for (;;) {
    const page = await getAccountList({ cursor, limit: 100 });
    all.push(...page.data);
    if (!page.pagination.has_more || !page.pagination.next_cursor) break;
    cursor = page.pagination.next_cursor;
  }
  return all;
}

export async function getAccountDetail(accountId: string): Promise<AccountDetail | null> {
  const accountRes = await fetchWithUserJwt<{ data: AccountsApiDetailItem | null }>(`accounts-api?id=${accountId}`);
  const account = accountRes.data;
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
    // risk_signals_triggered/evaluated colonnes plates confirmées par
    // l'exemple JSON complet de docs/SCORING_ENGINE_CONTRACT.md §7 (contrairement à
    // leur placement dans accounts-api?id=, non couvert par une assertion
    // des fixtures) — la ligne la plus récente sert de valeur "actuelle".
    supabase
      .from('score_history')
      .select('snapshot_date, health_score, churn_risk_score, expansion_score, mrr_cents, risk_signals_triggered, risk_signals_evaluated')
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

  const scoreHistoryRows = scoreRes.data || [];
  // La ligne la plus récente porte les signaux "actuels" — score_history est
  // trié snapshot_date DESC, donc [0] est le dernier calcul (voir commentaire
  // sur le select ci-dessus).
  const latestSignals = scoreHistoryRows[0] as (typeof scoreHistoryRows[number] & {
    risk_signals_triggered?: AccountDetail['risk_signals_triggered'];
    risk_signals_evaluated?: number;
  }) | undefined;

  return {
    id: account.id,
    organization_id: account.organization_id,
    stripe_customer_id: account.stripe_customer_id,
    display_name: account.display_name ?? null,
    hubspot_company_id: account.hubspot_company_id,
    plan_tier: account.plan_tier,
    billing_interval: account.billing_interval,
    mrr_cents: account.mrr_cents,
    mrr_status: account.mrr_status,
    is_delinquent: account.is_delinquent,
    delinquent_since: account.delinquent_since,
    arr_cents: account.arr_cents,
    seat_count: account.seat_count,
    seat_limit: account.seat_limit,
    contract_start_date: account.contract_start_date,
    contract_end_date: account.contract_end_date,
    primary_segment: account.primary_segment,
    score_breakdown: account.score_breakdown,
    scores_calculated_at: account.scores_calculated_at,
    health_score_is_new: account.health_score_is_new ?? false,
    last_stripe_sync_at: account.last_stripe_sync_at,
    last_hubspot_sync_at: account.last_hubspot_sync_at,
    flags: Array.isArray(account.flags) ? account.flags : [],
    created_at: account.created_at,
    // Champs imbriqués sous `scores.*` dans la réponse réelle — aplatis ici
    // pour le type interne AccountDetail (voir commentaire sur AccountsApiScores).
    health_score: account.scores.health.value,
    health_score_status: account.scores.health.status,
    health_score_band: account.scores.health.band,
    health_score_max_points: account.scores.health.max_points,
    trend_30d: account.scores.health.trend_30d,
    payment_health_score: account.scores.payment_health.value,
    revenue_dynamics_score: account.scores.revenue_dynamics.value,
    contract_renewal_score: account.scores.contract_renewal.value,
    churn_risk_score: account.scores.churn_risk.value,
    churn_risk_band: account.scores.churn_risk.band,
    expansion_score: account.scores.expansion.value,
    expansion_score_status: account.scores.expansion.status,
    expansion_unavailable_reason: account.scores.expansion.unavailable_reason,
    risk_signals_triggered: latestSignals?.risk_signals_triggered ?? [],
    risk_signals_evaluated: latestSignals?.risk_signals_evaluated ?? 0,
    subscriptions: subsRes.data || [],
    recent_invoices: invoicesRes.data || [],
    recent_usage: usageRes.data || [],
    score_history: scoreHistoryRows.map((h) => ({
      snapshot_date: h.snapshot_date,
      health_score: h.health_score,
      churn_risk_score: h.churn_risk_score,
      expansion_score: h.expansion_score,
      mrr_cents: h.mrr_cents,
    })),
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
