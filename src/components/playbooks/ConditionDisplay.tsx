import { Badge } from '@/components/ui/badge';
import { useT } from '@/lib/i18n/useT';
import type { ConditionGroup, Condition } from '@/lib/types/playbook';

function formatValue(value: string | number | boolean | string[]): string {
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

interface Props {
  conditionGroup: ConditionGroup | null | undefined;
}

export default function ConditionDisplay({ conditionGroup }: Props) {
  const fr = useT();

  function formatCondition(c: Condition): string {
    const field = fr.playbooks.fields[c.field as keyof typeof fr.playbooks.fields] ?? c.field;
    const op = fr.playbooks.operators[c.operator as keyof typeof fr.playbooks.operators] ?? c.operator;
    return `${field} ${op} ${formatValue(c.value)}`;
  }
  if (!conditionGroup || !conditionGroup.conditions || conditionGroup.conditions.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucune condition définie</p>;
  }

  return (
    <div className="space-y-2">
      {conditionGroup.conditions.map((condition, idx) => (
        <div key={idx} className="flex items-center gap-2 flex-wrap">
          {idx > 0 && (
            <Badge variant="secondary" className="text-xs">
              {conditionGroup.operator}
            </Badge>
          )}
          <span className="text-sm bg-muted px-2 py-1 rounded">
            {formatCondition(condition)}
          </span>
        </div>
      ))}
    </div>
  );
}
