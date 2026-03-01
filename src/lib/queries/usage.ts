import { supabase } from '@/lib/supabase';

export interface UsageMetrics {
  total_events_30d: number;
  unique_features_used: number;
  avg_daily_logins: number;
  dau_mau_ratio: number;
}

export async function getAccountUsageMetrics(
  accountId: string,
): Promise<UsageMetrics> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data, error } = await supabase
    .from('usage_events')
    .select('event_type, feature_name, event_count, event_date')
    .eq('account_id', accountId)
    .gte('event_date', thirtyDaysAgo.toISOString().split('T')[0]);

  if (error) throw error;

  const events = data || [];
  const uniqueFeatures = new Set(
    events.filter(e => e.feature_name).map(e => e.feature_name),
  );
  const loginEvents = events.filter(e => e.event_type === 'login');
  const uniqueLoginDays = new Set(loginEvents.map(e => e.event_date));

  return {
    total_events_30d: events.reduce((s, e) => s + (e.event_count || 0), 0),
    unique_features_used: uniqueFeatures.size,
    avg_daily_logins:
      loginEvents.reduce((s, e) => s + (e.event_count || 0), 0) / 30,
    dau_mau_ratio: uniqueLoginDays.size / 30,
  };
}

export async function getUsageByFeature(
  accountId: string,
): Promise<{ feature_name: string; total_count: number }[]> {
  const { data, error } = await supabase
    .from('usage_events')
    .select('feature_name, event_count')
    .eq('account_id', accountId)
    .not('feature_name', 'is', null);

  if (error) throw error;

  const byFeature = new Map<string, number>();
  for (const e of data || []) {
    const name = e.feature_name || 'unknown';
    byFeature.set(name, (byFeature.get(name) || 0) + (e.event_count || 0));
  }

  return Array.from(byFeature.entries())
    .map(([feature_name, total_count]) => ({ feature_name, total_count }))
    .sort((a, b) => b.total_count - a.total_count);
}
