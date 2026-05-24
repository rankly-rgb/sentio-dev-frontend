import { ShieldCheck, Check } from 'lucide-react';
import { useT } from '@/lib/i18n/useT';
import StripeApiKeyForm from './StripeApiKeyForm';
import StripeOAuthButton from './StripeOAuthButton';

interface Props {
  onSuccess: (method: 'api_key' | 'oauth') => void;
}

export default function StepConnectStripe({ onSuccess }: Props) {
  const t = useT();
  const w = t.onboardingWizard.stripe;

  const syncItems = [
    { label: w.dataSync1, desc: w.dataSync1desc },
    { label: w.dataSync2, desc: w.dataSync2desc },
    { label: w.dataSync3, desc: w.dataSync3desc },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">{w.title}</h2>
        <p className="mt-1 text-sm text-gray-500">{w.subtitle}</p>
      </div>

      <StripeApiKeyForm onSuccess={onSuccess} />

      {/* OAuth separator */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">{w.oauthSeparator}</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <StripeOAuthButton />

      {/* Synchronized data */}
      <div className="pt-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
          {w.dataSyncTitle}
        </p>
        <ul className="space-y-2">
          {syncItems.map((item) => (
            <li key={item.label} className="flex items-start gap-2 text-sm text-gray-600">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span>
                <span className="font-medium text-gray-700">{item.label}</span>
                {' — '}
                {item.desc}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Zero PII badge */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
        <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
        {w.zeroPiiBadge}
      </div>
    </div>
  );
}
