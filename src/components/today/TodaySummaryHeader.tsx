import { fr } from '@/i18n/fr';
import { useAuth } from '@/contexts/AuthContext';

interface TodaySummaryHeaderProps {
  p0Count: number;
}

export default function TodaySummaryHeader({ p0Count }: TodaySummaryHeaderProps) {
  const { user } = useAuth();
  const firstName = user?.full_name?.split(' ')[0] ?? null;

  const dateStr = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-bold text-foreground">
        {fr.today.greeting(firstName)} &mdash; {dateStr}
      </h1>
      {p0Count > 0 && (
        <p className="text-sm text-muted-foreground">
          {fr.today.actionCount(p0Count)}
        </p>
      )}
    </div>
  );
}
