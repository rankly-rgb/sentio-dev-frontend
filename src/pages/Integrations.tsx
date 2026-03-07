import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowLeft, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr as dateFnsFr } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { fr } from '@/i18n/fr';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { supabase } from '@/lib/supabase';
import WebhookConfigSection from '@/components/settings/WebhookConfigSection';

function IntegrationCard({
  name,
  connected,
  connectedLabel,
  notConnectedLabel,
  syncText,
  connectButton,
}: {
  name: string;
  connected: boolean;
  connectedLabel: string;
  notConnectedLabel: string;
  syncText?: string | null;
  connectButton?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <span className="font-medium">{name}</span>
          {connected ? (
            <Badge className="bg-emerald-500 hover:bg-emerald-600 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              {connectedLabel}
            </Badge>
          ) : (
            <Badge variant="secondary" className="flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              {notConnectedLabel}
            </Badge>
          )}
          {syncText && (
            <span className="text-xs text-muted-foreground">
              {fr.integrations.syncAgo(syncText)}
            </span>
          )}
        </div>
        {!connected && connectButton}
      </CardContent>
    </Card>
  );
}

function UpcomingCard({ name, date }: { name: string; date: string }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between py-4">
        <span className="font-medium text-muted-foreground">{name}</span>
        <Badge variant="outline" className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {date}
        </Badge>
      </CardContent>
    </Card>
  );
}

export default function Integrations() {
  const { user } = useAuth();
  const { organization, isLoading: orgLoading } = useOrganizationSettings();

  const { data: lastSyncData } = useQuery({
    queryKey: ['sync-status', 'last-stripe', user?.organization_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('data_syncs')
        .select('completed_at')
        .eq('organization_id', user?.organization_id ?? '')
        .eq('sync_status', 'completed')
        .eq('sync_source', 'stripe')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();
      return data?.completed_at ?? null;
    },
    enabled: !!user?.organization_id,
    staleTime: 60_000,
  });

  const stripeSyncText = lastSyncData
    ? formatDistanceToNow(new Date(lastSyncData), { addSuffix: true, locale: dateFnsFr })
    : null;

  if (orgLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/settings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            {fr.nav.settings}
          </Button>
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold">{fr.integrations.title}</h1>
        <p className="text-muted-foreground">{fr.integrations.subtitle}</p>
      </div>

      {/* Active integrations */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{fr.integrations.activeIntegrations}</h2>
        <IntegrationCard
          name="Stripe"
          connected={!!organization?.stripe_connected}
          connectedLabel={fr.settings.stripeConnected}
          notConnectedLabel={fr.settings.stripeNotConnected}
          syncText={stripeSyncText}
          connectButton={<Button size="sm">{fr.settings.connectStripe}</Button>}
        />
        <IntegrationCard
          name="HubSpot"
          connected={!!organization?.hubspot_connected}
          connectedLabel={fr.settings.hubspotConnected}
          notConnectedLabel={fr.settings.hubspotNotConnected}
          connectButton={<Button variant="outline" size="sm">{fr.settings.connectHubspot}</Button>}
        />
        <IntegrationCard
          name="Slack"
          connected={false}
          connectedLabel={fr.integrations.connected}
          notConnectedLabel={fr.integrations.notConnected}
          connectButton={<Button variant="outline" size="sm">{fr.integrations.connect}</Button>}
        />
      </section>

      {/* Webhook universel */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{fr.integrations.webhookUniversal}</h2>
        <WebhookConfigSection />
      </section>

      {/* A venir */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{fr.integrations.upcoming}</h2>
        <UpcomingCard name={fr.integrations.salesforce} date={fr.integrations.q2_2026} />
        <UpcomingCard name={fr.integrations.zendesk} date={fr.integrations.q3_2026} />
        <UpcomingCard name={fr.integrations.pipedrive} date={fr.integrations.q3_2026} />
      </section>
    </div>
  );
}
