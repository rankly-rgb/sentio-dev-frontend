// import { Link } from 'react-router-dom'; // V2 - utilisé par les liens Integrations/Webhook/Destinations
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import ProductMappingTable from '@/components/settings/ProductMappingTable';
import BillingSection from '@/components/settings/BillingSection';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { useIntegrationsConfig } from '@/hooks/useOnboardingFlow';
import { useUpdateStripeConnection, useDisconnectStripeConnection } from '@/hooks/useStripeConnection';
import { useHubspotSyncFreshness } from '@/hooks/useHubspotSyncFreshness';
import { useUpdateNotificationPreferences, useSendTestAlert } from '@/hooks/useNotificationPreferences';
import { useT } from '@/lib/i18n/useT';
import { maskEmail } from '@/lib/queries/settings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { CheckCircle, XCircle, UserPlus, Loader2, Eye, EyeOff } from 'lucide-react';

const STRIPE_KEY_PREFIXES = ['rk_live_', 'rk_test_', 'sk_live_', 'sk_test_'];
const MIN_KEY_SUFFIX_LENGTH = 20;

function isStripeKeyFormat(key: string): boolean {
  return STRIPE_KEY_PREFIXES.some(
    (prefix) => key.startsWith(prefix) && key.length >= prefix.length + MIN_KEY_SUFFIX_LENGTH,
  );
}

export default function Settings() {
  const fr = useT();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') ?? 'organization';
  const [activeTab, setActiveTab] = useState(initialTab);
  const { organization, team, isLoading } = useOrganizationSettings();
  const { data: integrationsConfig, isLoading: integrationLoading } = useIntegrationsConfig();
  useHubspotSyncFreshness(); // V2 - HubSpot : hook conservé pour V2, résultat non utilisé en V1

  const updatePrefs = useUpdateNotificationPreferences();
  const sendTest = useSendTestAlert();
  const updateStripeKey = useUpdateStripeConnection();
  const disconnectStripe = useDisconnectStripeConnection();

  const [notificationEmail, setNotificationEmail] = useState('');
  const [churnAlertEnabled, setChurnAlertEnabled] = useState(false);
  const [weeklyDigestEnabled, setWeeklyDigestEnabled] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const [showStripeKeyForm, setShowStripeKeyForm] = useState(false);
  const [stripeKeyInput, setStripeKeyInput] = useState('');
  const [showStripeKeyValue, setShowStripeKeyValue] = useState(false);
  const [stripeKeyClientError, setStripeKeyClientError] = useState<string | null>(null);
  const [confirmStripeDisconnect, setConfirmStripeDisconnect] = useState(false);

  useEffect(() => {
    if (organization) {
      setNotificationEmail(organization.notification_email ?? '');
      setChurnAlertEnabled(organization.churn_alert_enabled ?? false);
      setWeeklyDigestEnabled(organization.weekly_digest_enabled ?? false);
    }
  }, [organization]);

  async function handleSavePreferences() {
    await updatePrefs.mutateAsync({
      notification_email: notificationEmail || null,
      churn_alert_enabled: churnAlertEnabled,
      weekly_digest_enabled: weeklyDigestEnabled,
    });
  }

  async function handleToggleChurnAlert(checked: boolean) {
    setChurnAlertEnabled(checked);
    await updatePrefs.mutateAsync({
      notification_email: notificationEmail || null,
      churn_alert_enabled: checked,
      weekly_digest_enabled: weeklyDigestEnabled,
    });
  }

  async function handleToggleWeeklyDigest(checked: boolean) {
    setWeeklyDigestEnabled(checked);
    await updatePrefs.mutateAsync({
      notification_email: notificationEmail || null,
      churn_alert_enabled: churnAlertEnabled,
      weekly_digest_enabled: checked,
    });
  }

  async function handleTestAlert() {
    setTestResult(null);
    try {
      await sendTest.mutateAsync();
      setTestResult(fr.settings.testAlertSuccess);
    } catch {
      setTestResult(fr.settings.testAlertError);
    }
  }

  async function handleUpdateStripeKey() {
    const trimmed = stripeKeyInput.trim();
    if (!isStripeKeyFormat(trimmed)) {
      setStripeKeyClientError('The key must start with rk_live_, rk_test_, sk_live_, or sk_test_');
      return;
    }
    setStripeKeyClientError(null);
    try {
      await updateStripeKey.mutateAsync(trimmed);
      toast.success(fr.settings.stripeUpdateKeySuccess);
      setShowStripeKeyForm(false);
      setStripeKeyInput('');
    } catch {
      // Erreur affichée inline via updateStripeKey.error ci-dessous
    }
  }

  async function handleDisconnectStripe() {
    try {
      await disconnectStripe.mutateAsync();
      toast.success(fr.settings.stripeDisconnectSuccess);
      setConfirmStripeDisconnect(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to disconnect');
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const stripeConnected = integrationsConfig?.data.stripe_configured ?? false;
  const stripeAccountId = integrationsConfig?.data.stripe_account_id ?? null;
  const stripeConnectionMethod = integrationsConfig?.data.stripe_connection_method ?? null;
  // V2 - HubSpot : const hubspotConnected = integrationStatus?.hubspot?.connected ?? false;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">{fr.settings.title}</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="organization">{fr.settings.organization}</TabsTrigger>
          <TabsTrigger value="integrations">{fr.settings.integrations}</TabsTrigger>
          <TabsTrigger value="notifications">{fr.settings.notifications}</TabsTrigger>
          <TabsTrigger value="team">{fr.settings.team}</TabsTrigger>
          <TabsTrigger value="plans-sieges">{fr.settings.plans.tabLabel}</TabsTrigger>
          <TabsTrigger value="billing">{fr.settings.billing.tabLabel}</TabsTrigger>
        </TabsList>

        <TabsContent value="organization" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle>{fr.settings.orgName}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-lg font-medium">{organization?.name || '-'}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Created on {organization?.created_at ? fr.format.date(organization.created_at) : '-'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="mt-4 space-y-4">
          {/* Stripe status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{fr.settings.stripeConnect}</CardTitle>
                {integrationLoading ? (
                  <Skeleton className="h-5 w-28" />
                ) : stripeConnected ? (
                  <Badge className="bg-emerald-500 hover:bg-emerald-600">
                    <CheckCircle className="h-3 w-3 mr-1" /> {fr.settings.stripeConnected}
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" /> {fr.settings.stripeNotConnected}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {stripeConnected && (
                <>
                  {stripeConnectionMethod && (
                    <p className="text-sm text-muted-foreground">
                      {stripeConnectionMethod === 'api_key'
                        ? fr.settings.stripeConnectionMethodApiKey
                        : fr.settings.stripeConnectionMethodOAuth}
                    </p>
                  )}
                  {stripeAccountId && (
                    <p className="text-sm text-muted-foreground font-mono">{stripeAccountId}</p>
                  )}
                </>
              )}

              {!showStripeKeyForm ? (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowStripeKeyForm(true);
                      setStripeKeyClientError(null);
                    }}
                  >
                    {fr.settings.stripeUpdateKey}
                  </Button>
                  {stripeConnected && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setConfirmStripeDisconnect(true)}
                    >
                      {fr.settings.stripeDisconnect}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-w-md">
                  <Label htmlFor="stripe-update-key">{fr.settings.stripeUpdateKeyTitle}</Label>
                  <p className="text-xs text-muted-foreground">{fr.settings.stripeUpdateKeyDescription}</p>
                  <div className="relative">
                    <Input
                      id="stripe-update-key"
                      type={showStripeKeyValue ? 'text' : 'password'}
                      placeholder={fr.settings.stripeUpdateKeyPlaceholder}
                      value={stripeKeyInput}
                      onChange={(e) => {
                        setStripeKeyInput(e.target.value);
                        setStripeKeyClientError(null);
                      }}
                      className="pr-10 font-mono text-sm"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => setShowStripeKeyValue(!showStripeKeyValue)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showStripeKeyValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {(stripeKeyClientError || updateStripeKey.error) && (
                    <p className="text-sm text-destructive">
                      {stripeKeyClientError ?? updateStripeKey.error?.message}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleUpdateStripeKey}
                      disabled={updateStripeKey.isPending || !stripeKeyInput.trim()}
                    >
                      {updateStripeKey.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                      {updateStripeKey.isPending ? fr.settings.stripeUpdateKeySaving : fr.settings.stripeUpdateKeySave}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowStripeKeyForm(false);
                        setStripeKeyInput('');
                        setStripeKeyClientError(null);
                      }}
                      disabled={updateStripeKey.isPending}
                    >
                      {fr.settings.stripeUpdateKeyCancel}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <AlertDialog open={confirmStripeDisconnect} onOpenChange={setConfirmStripeDisconnect}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{fr.settings.stripeDisconnectConfirmTitle}</AlertDialogTitle>
                <AlertDialogDescription>{fr.settings.stripeDisconnectConfirmDesc}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{fr.common.cancel}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDisconnectStripe}
                  disabled={disconnectStripe.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {disconnectStripe.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                  {fr.settings.stripeDisconnect}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* V2 - HubSpot
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{fr.settings.hubspotConnect}</CardTitle>
                {integrationLoading ? (
                  <Skeleton className="h-5 w-28" />
                ) : _hubspotConnected ? (
                  <Badge className="bg-emerald-500 hover:bg-emerald-600">
                    <CheckCircle className="h-3 w-3 mr-1" /> {fr.settings.hubspotConnected}
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className="h-3 w-3 mr-1" /> {fr.settings.hubspotNotConnected}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              ... (code complet conservé pour V2)
            </CardContent>
          </Card>
          */}

          {/* V2 - Webhook/HubSpot/Destinations links
          <div className="flex flex-col gap-2">
            <Link to="/settings/integrations">
              <Button variant="outline" className="w-full justify-start">
                <ExternalLink className="h-4 w-4 mr-2" />
                {fr.integrations.title} — OAuth, Stripe, HubSpot
              </Button>
            </Link>
            <Link to="/settings/webhook">
              <Button variant="outline" className="w-full justify-start">
                <Link2 className="h-4 w-4 mr-2" />
                {fr.integrations.webhookUniversal}
              </Button>
            </Link>
            <Link to="/settings/destinations">
              <Button variant="outline" className="w-full justify-start">
                <Zap className="h-4 w-4 mr-2" />
                {fr.destinations.title}
              </Button>
            </Link>
          </div>
          */}
        </TabsContent>

        <TabsContent value="notifications" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{fr.settings.notifications}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{fr.settings.notificationsDesc}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email de notification */}
              <div className="space-y-2">
                <Label htmlFor="notification-email">{fr.settings.notificationEmail}</Label>
                <div className="flex gap-2">
                  <Input
                    id="notification-email"
                    type="email"
                    value={notificationEmail}
                    onChange={(e) => setNotificationEmail(e.target.value)}
                    placeholder={fr.settings.notificationEmailPlaceholder}
                    className="max-w-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={handleSavePreferences}
                    disabled={updatePrefs.isPending}
                  >
                    {updatePrefs.isPending ? fr.settings.savingPrefs : fr.settings.saveEmail}
                  </Button>
                </div>
              </div>

              {/* Préférences alertes */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="churn-alert"
                    checked={churnAlertEnabled}
                    onCheckedChange={(checked) => handleToggleChurnAlert(checked === true)}
                    disabled={updatePrefs.isPending}
                  />
                  <Label htmlFor="churn-alert" className="cursor-pointer">
                    {fr.settings.churnAlertEnabled}
                  </Label>
                </div>

                <div className="flex items-center gap-3">
                  <Checkbox
                    id="weekly-digest"
                    checked={weeklyDigestEnabled}
                    onCheckedChange={(checked) => handleToggleWeeklyDigest(checked === true)}
                    disabled={updatePrefs.isPending}
                  />
                  <Label htmlFor="weekly-digest" className="cursor-pointer">
                    {fr.settings.weeklyDigestEnabled}
                  </Label>
                </div>
              </div>

              {/* Bouton test */}
              <div className="space-y-2 pt-2 border-t">
                <Button
                  variant="outline"
                  onClick={handleTestAlert}
                  disabled={sendTest.isPending || !notificationEmail}
                >
                  {sendTest.isPending ? fr.settings.savingPrefs : fr.settings.sendTestAlert}
                </Button>
                {testResult && (
                  <p className={`text-sm ${sendTest.isError ? 'text-destructive' : 'text-emerald-600'}`}>
                    {testResult}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{fr.settings.team}</CardTitle>
                <Button size="sm"><UserPlus className="h-4 w-4 mr-2" /> {fr.settings.inviteUser}</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {team.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{maskEmail(member.email)}</p>
                      <p className="text-xs text-muted-foreground">{fr.format.date(member.created_at)}</p>
                    </div>
                    <Badge variant="outline">{member.role}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans-sieges" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{fr.settings.plans.tabLabel}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{fr.settings.plans.tabDescription}</p>
            </CardHeader>
            <CardContent>
              <ProductMappingTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="mt-4 space-y-4">
          <BillingSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
