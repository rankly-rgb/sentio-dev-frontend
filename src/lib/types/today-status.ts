export type TodayStatusLevel = 'critical' | 'at_risk' | 'stable';

export interface TodayUrgentAccount {
  id: string;
  name: string;
  mrr: number;
  risk_score: number;
  top_insight: string;
}

export interface TodayStatusResponse {
  status: TodayStatusLevel;
  critical_count: number;
  top_urgent_account: TodayUrgentAccount | null;
  total_mrr_cents: number;
  champions_count: number;
}
