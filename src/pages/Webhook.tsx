import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/useT';
import WebhookConfigSection from '@/components/settings/WebhookConfigSection';

export default function Webhook() {
  const fr = useT();
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Link to="/settings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            {fr.nav.settings}
          </Button>
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold">{fr.integrations.webhookUniversal}</h1>
        <p className="text-muted-foreground">{fr.integrations.webhook.description}</p>
      </div>
      <WebhookConfigSection />
    </div>
  );
}
