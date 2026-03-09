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
  Eye,
  EyeOff,
  ShieldAlert,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  useConnectStripeApiKey,
} from '@/hooks/useIntegrations';
import type { IntegrationProvider, IntegrationSummary } from '@/lib/types/integration';
import { validateStripeKey } from '@/lib/types/integration';
import WebhookConfigSection from '@/components/settings/WebhookConfigSection';

/** Stripe card with OAuth + API Key connection options */
function StripeCard({
  summary,
  isLoading,
}: {
  summary: IntegrationSummary | undefined;
  isLoading: boolean;
}) {
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [connectionMethod, setConnectionMethod] = useState<'oauth' | 'api_key'>('oauth');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  const authorizeMutation = useAuthorize();
  const revokeMutation = useRevokeIntegration();
  const apiKeyMutation = useConnectStripeApiKey();

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
  const method = summary?.integration_method;

  const handleOAuthConnect = () => {
    authorizeMutation.mutate('stripe');
  };

  const handleApiKeyConnect = () => {
    setClientError(null);
    const validation = validateStripeKey(apiKey);
    if (!validation.valid) {
      setClientError(validation.error ?? null);
      return;
    }
    apiKeyMutation.mutate(apiKey.trim(), {
      onSuccess: () => {
        setApiKey('');
        setShowKey(false);
      },
    });
  };

  const handleRevoke = () => {
    revokeMutation.mutate('stripe', {
      onSuccess: () => setConfirmRevoke(false),
    });
  };

  const isConnecting = authorizeMutation.isPending || apiKeyMutation.isPending;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{fr.integrations.stripeApiKey.title}</CardTitle>
            {connected && !isExpired && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {method === 'api_key' ? fr.integrations.oauth.methodApiKey : fr.integrations.oauth.methodOAuth}
                </Badge>
                <Badge className="bg-emerald-500 hover:bg-emerald-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {fr.integrations.connected}
                </Badge>
              </div>
            )}
            {isExpired && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {fr.integrations.oauth.stripeExpired}
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
        <CardContent className="space-y-4">
          {/* Connected state */}
          {connected && !isExpired && summary && (
            <>
              <p className="text-sm text-muted-foreground">
                {method === 'api_key'
                  ? fr.integrations.oauth.connectedViaApiKey
                  : fr.integrations.oauth.connectedViaOAuth}
              </p>
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

          {/* Not connected or expired — show connection options */}
          {(!connected || isExpired) && (
            <div className="space-y-4">
              <RadioGroup
                value={connectionMethod}
                onValueChange={(v) => {
                  setConnectionMethod(v as 'oauth' | 'api_key');
                  setClientError(null);
                }}
              >
                {/* Option A: OAuth */}
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="oauth" id="stripe-oauth" className="mt-0.5" />
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="stripe-oauth" className="font-medium cursor-pointer">
                      {fr.integrations.stripeApiKey.optionOAuth}
                    </Label>
                    {connectionMethod === 'oauth' && (
                      <Button
                        size="sm"
                        onClick={handleOAuthConnect}
                        disabled={isConnecting}
                      >
                        {authorizeMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                        {fr.integrations.oauth.connectStripe}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Option B: API Key */}
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="api_key" id="stripe-apikey" className="mt-0.5" />
                  <div className="space-y-3 flex-1">
                    <Label htmlFor="stripe-apikey" className="font-medium cursor-pointer">
                      {fr.integrations.stripeApiKey.optionApiKey}
                    </Label>
                    {connectionMethod === 'api_key' && (
                      <>
                        <p className="text-xs text-muted-foreground">
                          {fr.integrations.stripeApiKey.apiKeyDescription}
                        </p>
                        <div className="relative">
                          <Input
                            type={showKey ? 'text' : 'password'}
                            placeholder={fr.integrations.stripeApiKey.apiKeyPlaceholder}
                            value={apiKey}
                            onChange={(e) => {
                              setApiKey(e.target.value);
                              setClientError(null);
                            }}
                            className="pr-10 font-mono text-sm"
                            autoComplete="off"
                          />
                          <button
                            type="button"
                            onClick={() => setShowKey(!showKey)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {(clientError || apiKeyMutation.error) && (
                          <p className="text-sm text-destructive">
                            {clientError ?? apiKeyMutation.error?.message}
                          </p>
                        )}
                        <Button
                          size="sm"
                          onClick={handleApiKeyConnect}
                          disabled={isConnecting || !apiKey.trim()}
                        >
                          {apiKeyMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                          {apiKeyMutation.isPending
                            ? fr.integrations.stripeApiKey.connecting
                            : fr.integrations.stripeApiKey.connectButton}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </RadioGroup>

              {/* Security warning */}
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{fr.integrations.stripeApiKey.securityWarning}</span>
              </div>
            </div>
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

/** Generic provider card (HubSpot, etc.) — OAuth only */
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
                {fr.integrations.oauth.hubspotExpired}
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
              {fr.integrations.oauth.connectHubspot}
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

    if (callbackStatus === 'success' || callbackStatus === 'connected') {
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
          <StripeCard
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
