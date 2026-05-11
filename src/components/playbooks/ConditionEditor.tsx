import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useT } from '@/lib/i18n/useT';
import type { ConditionGroup, Condition, ConditionField, ConditionOperator } from '@/lib/types/playbook';

const FIELDS: ConditionField[] = [
  'health_score',
  'churn_risk_score',
  'expansion_score',
  'product_usage_score',
  'mrr_cents',
  'arr_cents',
  'plan_tier',
  'seat_count',
  'seat_limit',
  'contract_start_date',
  'contract_end_date',
];

const OPERATORS: ConditionOperator[] = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'not_in'];

function parseValue(field: string, raw: string): string | number | string[] {
  // 'in' / 'not_in' uses comma-separated values
  if (raw.includes(',')) {
    return raw.split(',').map((v) => v.trim());
  }
  // Numeric fields
  const numericFields = ['health_score', 'churn_risk_score', 'expansion_score', 'product_usage_score', 'mrr_cents', 'arr_cents', 'seat_count', 'seat_limit'];
  if (numericFields.includes(field) && !isNaN(Number(raw))) {
    return Number(raw);
  }
  return raw;
}

function displayValue(value: string | number | boolean | string[]): string {
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

interface Props {
  conditionGroup: ConditionGroup;
  onChange: (group: ConditionGroup) => void;
}

export default function ConditionEditor({ conditionGroup, onChange }: Props) {
  const fr = useT();
  const { operator, conditions } = conditionGroup;

  const setOperator = (op: 'AND' | 'OR') => {
    onChange({ ...conditionGroup, operator: op });
  };

  const addCondition = () => {
    const newCondition: Condition = { field: 'health_score', operator: 'gte', value: 0 };
    onChange({ ...conditionGroup, conditions: [...conditions, newCondition] });
  };

  const removeCondition = (idx: number) => {
    onChange({ ...conditionGroup, conditions: conditions.filter((_, i) => i !== idx) });
  };

  const updateCondition = (idx: number, patch: Partial<Condition>) => {
    const updated = conditions.map((c, i) => (i === idx ? { ...c, ...patch } : c));
    onChange({ ...conditionGroup, conditions: updated });
  };

  return (
    <div className="space-y-3">
      {/* Group operator */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{fr.playbooks.form.conditionGroupOp} :</span>
        <Select value={operator} onValueChange={(v) => setOperator(v as 'AND' | 'OR')}>
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AND">AND</SelectItem>
            <SelectItem value="OR">OR</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Conditions */}
      {conditions.map((condition, idx) => (
        <div key={idx} className="flex items-center gap-2 flex-wrap">
          {idx > 0 && (
            <span className="text-xs font-semibold text-muted-foreground w-10 text-center">
              {operator}
            </span>
          )}
          {idx === 0 && <span className="w-10" />}

          <Select
            value={condition.field}
            onValueChange={(v) => updateCondition(idx, { field: v as ConditionField })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIELDS.map((f) => (
                <SelectItem key={f} value={f}>
                  {fr.playbooks.fields[f]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={condition.operator}
            onValueChange={(v) => updateCondition(idx, { operator: v as ConditionOperator })}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPERATORS.map((op) => (
                <SelectItem key={op} value={op}>
                  {fr.playbooks.operators[op]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            className="w-[140px]"
            placeholder={fr.playbooks.form.conditionValue}
            value={displayValue(condition.value)}
            onChange={(e) =>
              updateCondition(idx, { value: parseValue(condition.field, e.target.value) })
            }
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={() => removeCondition(idx)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addCondition}>
        <Plus className="h-4 w-4 mr-2" />
        {fr.playbooks.form.addCondition}
      </Button>
    </div>
  );
}
