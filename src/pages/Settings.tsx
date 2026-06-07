// import { Link } from 'react-router-dom'; // V2 - utilisé par les liens Integrations/Webhook/Destinations
import { useState, useEffect } from 'react';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { useIntegrationStatus } from '@/hooks/useIntegrations';
import { useHubspotSyncFreshness } from '@/hooks/useHubspotSyncFreshness';
import { useUpdateNotificationPreferences, useSendTestAlert } from '@/hooks/useNotificationPreferences';
import { useT } from '@/lib/i18n/useT';
import { useLanguage } from '@/lib/i18n/useLanguage';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { maskEmail } from '@/lib/queries/settings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle, UserPlus } from 'lucide-react';

export default function Settings() {
  const fr = useT();
  const { organization, team, isLoading } = useOrganizationSettings();
  const { t } = useLanguage();
  const { data: integrationStatus, isLoading: integrationLoading } = useIntegrationStatus();
  useHubspotSyncFreshness(); // V2 - HubSpot : hook conservé pour V2, résultat non utilisé en V1

  const updatePrefs = useUpdateNotificationPreferences();
  const sendTest = useSendTestAlert();

  const [notificationEmail, setNotificationEmail] = useState('');
  const [churnAlertEnabled, setChurnAlertEnabled] = useState(false);
  const [weeklyDigestEnabled, setWeeklyDigestEnabled] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

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

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const stripeConnected = integrationStatus?.stripe?.connected ?? false;
  // V2 - HubSpot : const hubspotConnected = integrationStatus?.hubspot?.connected ?? false;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">{fr.settings.title}</h1>

      <Tabs defaultValue="organization">
        <TabsList>
          <TabsTrigger value="organization">{fr.settings.organization}</TabsTrigger>
          <TabsTrigger value="integrations">{fr.settings.integrations}</TabsTrigger>
          <TabsTrigger value="notifications">{fr.settings.notifications}</TabsTrigger>
          <TabsTrigger value="team">{fr.settings.team}</TabsTrigger>
        </TabsList>

        <TabsContent value="organization" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle>{fr.settings.orgName}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-lg font-medium">{organization?.name || '-'}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Creee le {organization?.created_at ? fr.format.date(organization.created_at) : '-'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('settings.language')}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{t('settings.languageDesc')}</p>
                </div>
                <LanguageSwitcher />
              </div>
            </CardHeader>
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
            <CardContent>
              {stripeConnected && integrationStatus?.stripe.provider_account_id && (
                <p className="text-sm text-muted-foreground font-mono">
                  {integrationStatus.stripe.provider_account_id}
                </p>
              )}
            </CardContent>
          </Card>

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
      </Tabs>
    </div>
  );
}
