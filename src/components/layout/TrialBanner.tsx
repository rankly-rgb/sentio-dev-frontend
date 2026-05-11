import { AlertTriangle, XCircle, ExternalLink } from 'lucide-react';
import { fr } from '@/i18n/fr';
import { cn } from '@/lib/utils';
import type { TrialStatus } from '@/lib/types/trial';

interface TrialBannerProps {
  trial: TrialStatus;
}

export default function TrialBanner({ trial }: TrialBannerProps) {
  if (trial.plan_type !== 'free') return null;

  const expired = trial.is_trial_expired;

  return (
    <div
      role="alert"
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 text-sm font-medium',
        expired
          ? 'bg-destructive/10 text-destructive border-b border-destructive/20'
          : 'bg-amber-50 text-amber-800 border-b border-amber-200',
      )}
    >
      {expired ? (
        <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
      ) : (
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
      )}

      <span className="flex-1">
        {expired ? (
          <>
            <span className="font-semibold">{fr.trial.bannerExpired}</span>
            {' '}
            {fr.trial.bannerExpiredSub}
          </>
        ) : (
          fr.trial.bannerActive(trial.trial_days_remaining)
        )}
      </span>

      <a
        href="mailto:contact@sentio.ai?subject=Upgrade"
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-colors',
          expired
            ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
            : 'bg-amber-700 text-white hover:bg-amber-800',
        )}
      >
        {fr.trial.upgrade}
        <ExternalLink className="h-3 w-3" aria-hidden="true" />
      </a>
    </div>
  );
}
