export interface ActionKpi {
  label: string;
  value: number;
  change?: number;
  trend?: 'up' | 'down' | 'flat';
}

export interface PlaybookSummary {
  id: string;
  name: string;
  trigger_type: string;
  is_active: boolean;
  total_executions: number;
  success_rate: number;
  last_executed_at: string | null;
}

export interface ExecutionRow {
  id: string;
  playbook_name: string;
  account_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result: string | null;
  created_at: string;
}

export interface TriggerConditionEditable {
  field: string;
  operator: string;
  value: string | number | boolean;
}
