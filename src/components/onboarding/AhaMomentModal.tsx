import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useT } from '@/lib/i18n/useT';
import { Button } from '@/components/ui/button';
import AccountName from '@/components/AccountName';
import ScoreBadge from '@/components/ScoreBadge';
import type { OnboardingStatus } from '@/hooks/useOnboardingStatus';

interface Props {
  status: OnboardingStatus;
  onClose: () => void;
}

export default function AhaMomentModal({ status, onClose }: Props) {
  const fr = useT();
  const navigate = useNavigate();
  const account = status.top_risk_account;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleViewAccount = () => {
    if (account) navigate(`/accounts/${account.id}`);
    onClose();
  };

  const handleExplore = () => {
    navigate('/accounts');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative mx-4 w-full max-w-md rounded-2xl bg-card p-8 shadow-2xl animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={fr.common.close}
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Sentio AI
          </div>
          <h2 className="text-xl font-bold leading-tight">{fr.onboarding.ahaMomentTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{fr.onboarding.ahaMomentSubtitle}</p>
        </div>

        {/* Top risk account card */}
        {account && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 mb-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  <AccountName
                    stripeId={account.stripe_customer_id}
                    displayName={account.display_name}
                  />
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <ScoreBadge score={account.health_score} type="health" />
                <ScoreBadge score={account.churn_risk_score} type="churn" />
              </div>
            </div>
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-col gap-2">
          <Button className="w-full" onClick={handleViewAccount}>
            {fr.onboarding.ahaMomentCta}
          </Button>
          <Button variant="ghost" className="w-full text-muted-foreground text-sm" onClick={handleExplore}>
            {fr.onboarding.ahaMomentSkip}
          </Button>
        </div>
      </div>
    </div>
  );
}
