import { supabase } from '@/lib/supabase';
import type { MrrMovementSummary, MrrTrendPoint } from '@/types/dashboard';

export async function getMrrMovementSummary(period: {
  from: string;
  to: string;
}): Promise<MrrMovementSummary> {
  const { data, error } = await supabase
    .from('mrr_movements')
    .select('movement_type, amount_cents')
    .gte('movement_date', period.from)
    .lte('movement_date', period.to);

  if (error) throw error;

  const movements = data || [];
  const sumByType = (type: string) =>
    movements
      .filter(m => m.movement_type === type)
      .reduce((s, m) => s + (m.amount_cents || 0), 0);

  return {
    new_cents: sumByType('new'),
    expansion_cents: sumByType('expansion'),
    contraction_cents: Math.abs(sumByType('contraction')),
    churn_cents: Math.abs(sumByType('churn')),
    reactivation_cents: sumByType('reactivation'),
    net_cents: movements.reduce((s, m) => s + (m.amount_cents || 0), 0),
  };
}

export async function getMrrTrend(_months: number = 12): Promise<
  { date: string; mrr_cents: number }[]
> {
  const { data, error } = await supabase
    .from('mrr_movements')
    .select('movement_type, amount_cents, movement_date')
    .order('movement_date', { ascending: true });

  if (error) throw error;

  // Grouper par mois
  const byMonth = new Map<string, number>();
  let runningMrr = 0;

  for (const m of data || []) {
    const month = m.movement_date?.substring(0, 7); // "YYYY-MM"
    if (!month) continue;
    runningMrr += m.amount_cents || 0;
    byMonth.set(month, runningMrr);
  }

  return Array.from(byMonth.entries()).map(([date, mrr_cents]) => ({
    date,
    mrr_cents,
  }));
}

/** Appelle la RPC get_mrr_trend pour récupérer la série temporelle MRR */
export async function fetchMrrTrend(startDate: string, endDate: string): Promise<MrrTrendPoint[]> {
  const { data, error } = await supabase.rpc('get_mrr_trend', {
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) throw error;
  return (data as MrrTrendPoint[]) || [];
}
