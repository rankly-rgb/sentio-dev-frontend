import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  CheckCircle,
  XCircle,
  ArrowLeft,
  Calendar,
  Loader2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { fr } from '@/i18n/fr';
import {
  useIntegrationStatus,
  useAuthorize,
  useRevokeIntegration,
} from '@/hooks/useIntegrations';
import type { IntegrationProvider, IntegrationSummary } from '@/lib/types/integration';
import WebhookConfigSection from '@/components/settings/WebhookConfigSection';

function ProviderCard({
  provider,
  label,
  summary,
  isLoading,
}: {
  provider: IntegrationProvider;
  label: string;
  summary: IntegrationSummary | undefined;
  isLoading: boolean;
}) {
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const authorizeMutation = useAuthorize();
  const revokeMutation = useRevokeIntegration();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  const connected = summary?.connected ?? false;
  const isExpired = summary?.status === 'expired' || summary?.status === 'revoked';

  const handleConnect = () => {
    authorizeMutation.mutate(provider);
  };

  const handleRevoke = () => {
    revokeMutation.mutate(provider, {
      onSuccess: () => setConfirmRevoke(false),
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{label}</CardTitle>
            {connected && !isExpired && (
              <Badge className="bg-emerald-500 hover:bg-emerald-600 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                {fr.integrations.connected}
              </Badge>
            )}
            {isExpired && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {provider === 'stripe'
                  ? fr.integrations.oauth.stripeExpired
                  : fr.integrations.oauth.hubspotExpired}
              </Badge>
            )}
            {!connected && !isExpired && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                {fr.integrations.notConnected}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {connected && !isExpired && summary && (
            <>
              {summary.provider_account_id && (
                <div>
                  <p className="text-xs text-muted-foreground">{fr.integrations.oauth.providerAccountId}</p>
                  <p className="text-sm font-mono">{summary.provider_account_id}</p>
                </div>
              )}
              {summary.scopes.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">{fr.integrations.oauth.scopes}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {summary.scopes.map((scope) => (
                      <Badge key={scope} variant="outline" className="text-xs font-mono">
                        {scope}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setConfirmRevoke(true)}
                disabled={revokeMutation.isPending}
              >
                {revokeMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                {fr.integrations.oauth.disconnect}
              </Button>
            </>
          )}

          {isExpired && (
            <Button size="sm" onClick={handleConnect} disabled={authorizeMutation.isPending}>
              {authorizeMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {fr.integrations.oauth.reconnect}
            </Button>
          )}

          {!connected && !isExpired && (
            <Button onClick={handleConnect} disabled={authorizeMutation.isPending}>
              {authorizeMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {provider === 'stripe'
                ? fr.integrations.oauth.connectStripe
                : fr.integrations.oauth.connectHubspot}
            </Button>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmRevoke} onOpenChange={setConfirmRevoke}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{fr.integrations.oauth.confirmRevoke}</AlertDialogTitle>
            <AlertDialogDescription>
              {fr.integrations.oauth.confirmRevokeDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{fr.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              disabled={revokeMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revokeMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {fr.integrations.oauth.disconnect}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: status, isLoading, refetch } = useIntegrationStatus();

  // Handle OAuth callback query params
  useEffect(() => {
    const callbackProvider = searchParams.get('provider');
    const callbackStatus = searchParams.get('status');

    if (!callbackProvider || !callbackStatus) return;

    if (callbackStatus === 'success') {
      toast.success(fr.integrations.oauth.callbackSuccess);
      refetch();
    } else {
      const errorMsg = searchParams.get('error') ?? '';
      toast.error(
        errorMsg
          ? `${fr.integrations.oauth.callbackError} : ${errorMsg}`
          : fr.integrations.oauth.callbackError,
      );
    }

    // Clean up query params
    setSearchParams({}, { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

      {/* OAuth Integrations */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{fr.integrations.activeIntegrations}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ProviderCard
            provider="stripe"
            label="Stripe Connect"
            summary={status?.stripe}
            isLoading={isLoading}
          />
          <ProviderCard
            provider="hubspot"
            label="HubSpot"
            summary={status?.hubspot}
            isLoading={isLoading}
          />
        </div>
      </section>

      {/* Webhook */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{fr.integrations.webhookUniversal}</h2>
          <Link to="/settings/webhook">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-1" />
              Configuration avancee
            </Button>
          </Link>
        </div>
        <WebhookConfigSection />
      </section>

      {/* Upcoming */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{fr.integrations.upcoming}</h2>
        <UpcomingCard name={fr.integrations.salesforce} date={fr.integrations.q2_2026} />
        <UpcomingCard name={fr.integrations.zendesk} date={fr.integrations.q3_2026} />
        <UpcomingCard name={fr.integrations.pipedrive} date={fr.integrations.q3_2026} />
      </section>
    </div>
  );
}
