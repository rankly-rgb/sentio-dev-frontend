// ─── Insight types for insights-crud Edge Function ─────────────────────────

export type InsightType =
  | 'churn_prediction'
  | 'expansion_opportunity'
  | 'renewal_alert'
  | 'payment_risk'
  | 'usage_drop'
  | 'account_health_summary';

export type InsightPriority = 'low' | 'medium' | 'high' | 'critical';

export type InsightStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed';

export interface Insight {
  id: string;
  organization_id: string;
  account_id: string | null;
  insight_type: InsightType;
  title: string;
  description: string;
  recommended_action: string | null;
  priority: InsightPriority;
  confidence_score: number | null;
  mrr_impact_cents: number | null;
  status: InsightStatus;
  source_scores: Record<string, number> | null;
  ai_model_version: string | null;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
  dismissed_at: string | null;
  created_at: string;
  updated_at: string;
  is_new?: boolean;
}

export interface InsightsPagination {
  page: number;
  per_page: number;
  total_count: number;
}

export interface InsightsListResponse {
  data: Insight[];
  pagination: InsightsPagination;
  critical_count: number;
}

export interface InsightStats {
  total: number;
  total_mrr_impact_cents: number;
  by_type: Record<string, number>;
  by_priority: Record<string, number>;
  by_status: Record<string, number>;
}

export interface InsightStatsResponse {
  data: InsightStats;
}

export interface InsightDetailResponse {
  data: Insight;
}

export interface InsightsFilters {
  insight_type?: string;
  priority?: string;
  status?: string;
  account_id?: string;
  sort?: string;
  page?: number;
  per_page?: number;
}
