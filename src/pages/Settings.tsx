import { Link } from 'react-router-dom';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { fr } from '@/i18n/fr';
import { maskEmail } from '@/lib/queries/settings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle, UserPlus, ExternalLink } from 'lucide-react';

export default function Settings() {
  const { organization, team, isLoading } = useOrganizationSettings();

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">{fr.settings.title}</h1>

      <Tabs defaultValue="organization">
        <TabsList>
          <TabsTrigger value="organization">{fr.settings.organization}</TabsTrigger>
          <TabsTrigger value="integrations">{fr.settings.integrations}</TabsTrigger>
          <TabsTrigger value="team">{fr.settings.team}</TabsTrigger>
        </TabsList>

        <TabsContent value="organization" className="mt-4">
          <Card>
            <CardHeader><CardTitle>{fr.settings.orgName}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-lg font-medium">{organization?.name || '-'}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Créée le {organization?.created_at ? fr.format.date(organization.created_at) : '-'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{fr.settings.stripeConnect}</CardTitle>
                {organization?.stripe_connected ? (
                  <Badge className="bg-success"><CheckCircle className="h-3 w-3 mr-1" /> {fr.settings.stripeConnected}</Badge>
                ) : (
                  <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> {fr.settings.stripeNotConnected}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {organization?.stripe_connected ? (
                <p className="text-sm text-muted-foreground font-mono">{organization.stripe_account_id}</p>
              ) : (
                <Button>{fr.settings.connectStripe}</Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{fr.settings.hubspotConnect}</CardTitle>
                {organization?.hubspot_connected ? (
                  <Badge className="bg-success"><CheckCircle className="h-3 w-3 mr-1" /> {fr.settings.hubspotConnected}</Badge>
                ) : (
                  <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" /> {fr.settings.hubspotNotConnected}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!organization?.hubspot_connected && <Button variant="outline">{fr.settings.connectHubspot}</Button>}
            </CardContent>
          </Card>

          <Link to="/settings/integrations">
            <Button variant="outline" className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              {fr.integrations.title} — Webhook, Slack, Stripe...
            </Button>
          </Link>
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
