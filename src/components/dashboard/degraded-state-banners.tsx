import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useT } from '@/lib/i18n/useT';

export function StripeStaleBanner({ onSync, isSyncing }: { onSync: () => void; isSyncing: boolean }) {
  const fr = useT();
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm py-2 px-4">
      <div className="flex items-center gap-2 min-w-0">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>{fr.dashboard.stripeStaleBanner}</span>
      </div>
      <button
        type="button"
        onClick={onSync}
        disabled={isSyncing}
        className="flex items-center gap-1.5 text-amber-900 hover:underline font-medium whitespace-nowrap shrink-0 disabled:opacity-50"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
        {fr.dashboard.stripeStaleBannerCta}
      </button>
    </div>
  );
}

export function BillingProfileNeedsReviewBanner() {
  const fr = useT();
  return (
    <div className="flex items-center gap-2 rounded-md bg-blue-50 border border-blue-100 text-blue-800 text-sm py-2 px-4">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>{fr.dashboard.billingProfileNeedsReviewBanner}</span>
    </div>
  );
}
