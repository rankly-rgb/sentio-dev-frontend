import { useT } from '@/lib/i18n/useT';
import { Card, CardContent } from '@/components/ui/card';
import { Target } from 'lucide-react';

interface Props {
  count: number;
}

export function ExpansionOpportunities({ count }: Props) {
  const fr = useT();
  if (count === 0) return null;

  return (
    <Card className="border-success bg-success/5">
      <CardContent className="p-4 flex items-start gap-3">
        <Target className="h-5 w-5 text-success mt-0.5 shrink-0" />
        <div>
          <p className="font-medium text-success">
            {count} {fr.dashboard.expansionOpportunities.toLowerCase()}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Comptes avec un score d'expansion &gt; 75
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
