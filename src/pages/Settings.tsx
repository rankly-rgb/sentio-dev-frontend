import { Link } from 'react-router-dom';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { useIntegrationStatus } from '@/hooks/useIntegrations';
import { useHubspotSyncFreshness } from '@/hooks/useHubspotSyncFreshness';
import { fr } from '@/i18n/fr';
import { useLanguage } from '@/lib/i18n/useLanguage';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { maskEmail } from '@/lib/queries/settings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle, UserPlus, ExternalLink, Link2, Zap } from 'lucide-react';

export default function Settings() {
  const { organization, team, isLoading } = useOrganizationSettings();
  const { t } = useLanguage();
  const { data: integrationStatus, isLoading: integrationLoading } = useIntegrationStatus();
  const { hubspotStale, lastHubspotSyncHoursAgo } = useHubspotSyncFreshness();

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const stripeConnected = integrationStatus?.stripe?.connected ?? false;
  const hubspotConnected = integrationStatus?.hubspot?.connected ?? false;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">{fr.settings.title}</h1>

      <Tabs defaultValue="organization">
        <TabsList>
          <TabsTrigger value="organization">{fr.settings.organization}</TabsTrigger>
          <TabsTrigger value="integrations">{fr.settings.integrations}</TabsTrigger>
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

          {/* HubSpot status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{fr.settings.hubspotConnect}</CardTitle>
                {integrationLoading ? (
                  <Skeleton className="h-5 w-28" />
                ) : hubspotConnected ? (
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
              {hubspotConnected && integrationStatus?.hubspot.provider_account_id && (
                <p className="text-sm text-muted-foreground font-mono">
                  {integrationStatus.hubspot.provider_account_id}
                </p>
              )}
              {hubspotConnected && hubspotStale === true && lastHubspotSyncHoursAgo === null && (
                <span className="inline-block rounded-full px-3 py-1 text-xs font-medium bg-amber-100 text-amber-800 mt-2">
                  {fr.settings.hubspotNeverSynced}
                </span>
              )}
              {hubspotConnected && hubspotStale === true && lastHubspotSyncHoursAgo !== null && (
                <span className="inline-block rounded-full px-3 py-1 text-xs font-medium bg-red-100 text-red-800 mt-2">
                  {fr.settings.hubspotStale(Math.round(lastHubspotSyncHoursAgo))}
                </span>
              )}
              {hubspotConnected && hubspotStale === false && lastHubspotSyncHoursAgo !== null && (
                <span className="inline-block rounded-full px-3 py-1 text-xs font-medium bg-green-100 text-green-800 mt-2">
                  {fr.settings.hubspotSyncFresh(Math.round(lastHubspotSyncHoursAgo))}
                </span>
              )}
            </CardContent>
          </Card>

          {/* Links to dedicated pages */}
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
