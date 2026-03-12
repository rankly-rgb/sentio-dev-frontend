/** Types pour la page admin Ops */

// ─── Health Check ────────────────────────────────────────────────────────

export type HealthStatus = 'ok' | 'degraded' | 'unhealthy';
export type CheckStatus = 'ok' | 'warning' | 'critical';

export interface HealthCheckItem {
  name: string;
  status: CheckStatus;
  message?: string;
  latency_ms?: number;
}

export interface HealthCheckResponse {
  status: HealthStatus;
  checks: HealthCheckItem[];
  timestamp: string;
  /** true if last HubSpot sync > 48h or never synced */
  hubspot_stale?: boolean;
  /** null if never synced */
  last_hubspot_sync_hours_ago?: number | null;
}

// ─── Self-Monitor ────────────────────────────────────────────────────────

export interface SelfMonitorResponse {
  success: boolean;
  actions_taken: number;
  actions: string[];
  timestamp: string;
}

// ─── DLQ (Dead Letter Queue) ─────────────────────────────────────────────

export interface WebhookDeadLetter {
  id: string;
  organization_id: string;
  provider: string;
  event_type: string;
  payload: Record<string, unknown>;
  error_message: string | null;
  retry_count: number;
  created_at: string;
  resolved_at: string | null;
}

export interface DlqFilters {
  provider: string;
  event_type: string;
  date_from?: string;
  page: number;
}

// ─── Cron Locks ──────────────────────────────────────────────────────────

export interface CronLock {
  id: string;
  lock_key: string;
  locked_by: string;
  locked_at: string;
  expires_at: string;
  released_at: string | null;
}

// ─── Syncs Extended Filters ──────────────────────────────────────────────

export interface SyncsExtendedFilters {
  status: string;
  source: string;
  page: number;
}
