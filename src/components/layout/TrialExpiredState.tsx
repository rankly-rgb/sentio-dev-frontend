import { XCircle, ExternalLink } from 'lucide-react';
import { useT } from '@/lib/i18n/useT';

/**
 * Incident 2026-08-13: every page that calls a trial-gated Edge Function
 * (fetchWithUserJwt throws TrialExpiredError on 402) fell through to a
 * generic "An error occurred" / "Unable to load X" state instead of this —
 * indistinguishable from a real outage. Render this whenever a page-level
 * query's error is a TrialExpiredError, in place of the generic error card.
 */
export default function TrialExpiredState() {
  const fr = useT();
  return (
    <div className="flex items-center justify-center py-16 px-6">
      <div className="max-w-sm text-center">
        <XCircle className="mx-auto h-8 w-8 text-destructive mb-3" aria-hidden="true" />
        <p className="font-semibold text-destructive mb-1">{fr.trial.bannerExpired}</p>
        <p className="text-sm text-muted-foreground mb-4">{fr.trial.bannerExpiredSub}</p>
        <a
          href="mailto:contact@sentio.ai?subject=Upgrade"
          className="inline-flex items-center gap-1.5 rounded-md bg-destructive px-4 py-2 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 transition-colors"
        >
          {fr.trial.upgrade}
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
