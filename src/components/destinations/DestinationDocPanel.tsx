import { Info } from 'lucide-react';
import { useT } from '@/lib/i18n/useT';
import type { WebhookProvider } from '@/lib/types/webhook-destinations';

interface Props {
  provider: WebhookProvider;
}

const PAYLOAD_EXAMPLE = `{
  "source": "sentio_ai",
  "event": "account_risk_detected",
  "account": {
    "stripe_customer_id": "cus_xxx",
    "segment": "critical",
    "health_score": 23,
    "churn_risk_score": 87,
    "expansion_score": 5,
    "mrr_eur": 49900
  },
  "triggered_at": "2026-04-26T10:00:00Z"
}`;

function DocSteps({ steps }: { steps: readonly string[] }) {
  return (
    <ol className="space-y-2 text-sm text-muted-foreground">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
            {i + 1}
          </span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  );
}

export default function DestinationDocPanel({ provider }: Props) {
  const fr = useT();
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 space-y-3 h-fit">
      <div className="flex items-center gap-2 text-sm font-semibold text-blue-800">
        <Info className="h-4 w-4 shrink-0" />
        Configuration {fr.destinations.providers[provider]}
      </div>

      {provider === 'brevo' && <DocSteps steps={fr.destinations.doc.brevoSteps} />}
      {provider === 'slack' && <DocSteps steps={fr.destinations.doc.slackSteps} />}
      {provider === 'lemlist' && <DocSteps steps={fr.destinations.doc.lemlistSteps} />}

      {(provider === 'custom' || provider === 'mailchimp' || provider === 'activecampaign') && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Sentio enverra un POST JSON vers votre URL avec ce payload :
          </p>
          <pre className="text-xs bg-white/80 border border-blue-100 rounded-md p-2.5 overflow-x-auto font-mono leading-relaxed">
            {PAYLOAD_EXAMPLE}
          </pre>
          <p className="text-xs text-blue-700 italic">
            Aucune donnée personnelle (email, nom) n'est transmise.
          </p>
        </div>
      )}
    </div>
  );
}
