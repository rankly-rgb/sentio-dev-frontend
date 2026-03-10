import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Lightbulb } from 'lucide-react';
import { fr } from '@/i18n/fr';

const DISMISSED_KEY = 'sentio:tracker-banner-dismissed';

export function TrackerBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISSED_KEY) === '1';
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // localStorage indisponible
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-blue-50 border-b border-blue-100 text-blue-800 text-sm py-2 px-4">
      <div className="flex items-center gap-2 min-w-0">
        <Lightbulb className="h-4 w-4 shrink-0" />
        <span className="truncate">{fr.integrations.tracker.bannerMessage}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          to="/settings/integrations#tracker"
          className="text-blue-700 hover:underline font-medium whitespace-nowrap"
        >
          {fr.integrations.tracker.bannerCta} →
        </Link>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-blue-600 hover:text-blue-800 p-0.5"
          aria-label={fr.common.close}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
