import { fr } from '@/i18n/fr';
import { useNextRenewal } from '@/hooks/useToday';

export default function EmptyTodayState() {
  const { data: nextRenewalDays } = useNextRenewal();

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-4xl mb-4">{'\u2705'}</span>
      <p className="text-lg font-medium text-foreground">{fr.today.allClear}</p>
      {nextRenewalDays != null && nextRenewalDays > 0 && (
        <p className="text-sm text-muted-foreground mt-2">
          {fr.today.nextRenewal(nextRenewalDays)}
        </p>
      )}
    </div>
  );
}
