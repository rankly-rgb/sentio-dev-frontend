import { supabase } from '@/lib/supabase';

export interface HubspotCompanyData {
  hubspot_company_id: string;
  lifecycle_stage: string | null;
  nps_score: number | null;
  open_deal_count: number;
  open_ticket_count: number;
  last_meeting_date: string | null;
  last_email_date: string | null;
  last_synced_at: string | null;
}

export async function getHubspotCompanyForAccount(
  accountId: string,
): Promise<HubspotCompanyData | null> {
  const { data, error } = await supabase
    .from('hubspot_companies')
    .select(
      'hubspot_company_id, lifecycle_stage, nps_score, open_deal_count, open_ticket_count, last_meeting_date, last_email_date, last_synced_at',
    )
    .eq('account_id', accountId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function getHubspotEngagementSummary(): Promise<{
  avg_nps: number | null;
  accounts_with_open_tickets: number;
  accounts_no_meeting_60d: number;
}> {
  const { data, error } = await supabase
    .from('hubspot_companies')
    .select('nps_score, open_ticket_count, last_meeting_date');

  if (error) throw error;

  const companies = data || [];
  const npsScores = companies
    .filter((c): c is typeof c & { nps_score: number } => c.nps_score !== null)
    .map(c => c.nps_score);
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  return {
    avg_nps:
      npsScores.length > 0
        ? npsScores.reduce((s, n) => s + n, 0) / npsScores.length
        : null,
    accounts_with_open_tickets: companies.filter(
      c => (c.open_ticket_count || 0) > 0,
    ).length,
    accounts_no_meeting_60d: companies.filter(c => {
      if (!c.last_meeting_date) return true;
      return new Date(c.last_meeting_date) < sixtyDaysAgo;
    }).length,
  };
}
