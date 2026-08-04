import { useT } from '@/lib/i18n/useT';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface Props {
  count: number;
  mrrAtRisk: number;
}

export function ChurnRiskAlert({ count, mrrAtRisk }: Props) {
  const fr = useT();
  const { user } = useAuth();
  const currency = user?.currency ?? 'usd';
  if (count === 0) return null;

  return (
    <Card className="border-destructive bg-destructive/5">
      <CardContent className="p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
        <div>
          <p className="font-medium text-destructive">
            {count} {fr.dashboard.accountsAtRisk.toLowerCase()}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {fr.format.currency(mrrAtRisk, currency)} de MRR en danger
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
