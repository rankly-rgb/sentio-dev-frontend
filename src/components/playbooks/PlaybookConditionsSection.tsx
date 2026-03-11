import { fr } from '@/i18n/fr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PlaybookFullDetailCondition } from '@/lib/types/playbook';

interface Props {
  conditions: PlaybookFullDetailCondition[];
}

export default function PlaybookConditionsSection({ conditions }: Props) {
  if (!conditions || conditions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{fr.playbooks.conditionsTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {conditions.map((condition, idx) => (
            <li key={idx} className="flex items-center gap-2 flex-wrap">
              {idx > 0 && (
                <span className="text-xs text-muted-foreground uppercase font-medium">
                  ET
                </span>
              )}
              <span className="text-sm bg-muted px-3 py-1.5 rounded-md">
                {condition.label}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
