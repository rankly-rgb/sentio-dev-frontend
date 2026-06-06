import { Link } from 'react-router-dom';
import { CheckCircle2, Circle } from 'lucide-react';
import { useT } from '@/lib/i18n/useT';
import type { OnboardingStatus } from '@/hooks/useOnboardingStatus';

interface Props {
  status: OnboardingStatus;
}

export default function OnboardingProgressBar({ status }: Props) {
  const fr = useT();
  // V1 : seul Stripe est requis — HubSpot masqué (V2 : restaurer la condition && status.hubspot_connected)
  const allConnected = status.stripe_connected;
  if (allConnected) return null;

  const steps = [
    { label: fr.onboarding.stripeNotConnected, done: status.stripe_connected },
    // V2 - HubSpot : { label: fr.onboarding.hubspotNotConnected, done: status.hubspot_connected },
  ].filter(s => !s.done);

  const remaining = steps.length;

  return (
    <div className="bg-primary/5 border-b border-primary/10 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-medium text-primary">{fr.onboarding.progressTitle}</span>
          <span className="text-xs text-muted-foreground">{fr.onboarding.stepsRemaining(remaining)}</span>
          <div className="flex items-center gap-2">
            {steps.map((step) => (
              <span key={step.label} className="flex items-center gap-1 text-xs text-muted-foreground">
                {step.done ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                ) : (
                  <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />
                )}
                {step.label}
              </span>
            ))}
          </div>
        </div>
        {/* V2 - remplacer /settings par /settings/integrations quand HubSpot réactivé */}
        <Link
          to="/settings"
          className="text-xs font-medium text-primary hover:underline shrink-0"
        >
          {fr.onboarding.configureIntegrations} →
        </Link>
      </div>
    </div>
  );
}
