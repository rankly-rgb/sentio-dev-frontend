import { useState } from 'react';
import { Pencil, Trash2, TestTube2, FileText, Loader2, Power } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr as dateFnsFr } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { useT } from '@/lib/i18n/useT';
import DestinationTestResult from './DestinationTestResult';
import {
  useTestDestination,
  useUpdateDestination,
  useDeleteDestination,
} from '@/hooks/useWebhookDestinations';
import type {
  OutboundWebhookDestination,
  SegmentKey,
  WebhookProvider,
} from '@/lib/types/webhook-destinations';

interface DestinationsListProps {
  destinations: OutboundWebhookDestination[];
  onEdit: (dest: OutboundWebhookDestination) => void;
  onViewLogs: (dest: OutboundWebhookDestination) => void;
}

const PROVIDER_ICONS: Record<WebhookProvider, string> = {
  brevo: '📧',
  mailchimp: '🦁',
  lemlist: '📬',
  activecampaign: '⚡',
  slack: '💬',
  custom: '🔗',
};

const SEGMENT_COLORS: Record<SegmentKey, string> = {
  critical: 'bg-red-100 text-red-700',
  at_risk: 'bg-orange-100 text-orange-700',
  past_due: 'bg-yellow-100 text-yellow-800',
  champions: 'bg-gray-100 text-gray-600',
  expanding: 'bg-gray-100 text-gray-600',
  stable: 'bg-gray-100 text-gray-600',
  churned: 'bg-gray-100 text-gray-600',
  new: 'bg-gray-100 text-gray-600',
};

function truncateUrl(url: string): string {
  return url.length > 40 ? `${url.slice(0, 40)}…` : url;
}

interface CardProps {
  destination: OutboundWebhookDestination;
  onEdit: (dest: OutboundWebhookDestination) => void;
  onViewLogs: (dest: OutboundWebhookDestination) => void;
}

function DestinationCard({ destination, onEdit, onViewLogs }: CardProps) {
  const fr = useT();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showTestResult, setShowTestResult] = useState(false);

  const testMutation = useTestDestination();
  const toggleMutation = useUpdateDestination();
  const deleteMutation = useDeleteDestination();

  const handleTest = () => {
    setShowTestResult(true);
    testMutation.mutate(destination.id);
  };

  const handleToggle = () => {
    toggleMutation.mutate({ id: destination.id, is_active: !destination.is_active });
  };

  const handleDeleteConfirm = () => {
    deleteMutation.mutate(destination.id, {
      onSuccess: () => setShowDeleteAlert(false),
    });
  };

  const lastTriggeredText = destination.last_triggered_at
    ? formatDistanceToNow(new Date(destination.last_triggered_at), {
        addSuffix: true,
        locale: dateFnsFr,
      })
    : null;

  return (
    <>
      <Card>
        <CardContent className="pt-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-2xl leading-none shrink-0">
                {PROVIDER_ICONS[destination.provider]}
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{destination.name}</p>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  {truncateUrl(destination.destination_url)}
                </p>
              </div>
            </div>
            <Badge
              className={
                destination.is_active
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 shrink-0'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-100 shrink-0'
              }
              variant="secondary"
            >
              {destination.is_active ? fr.destinations.active : fr.destinations.inactive}
            </Badge>
          </div>

          {/* Triggers */}
          {(destination.trigger_segments.length > 0 || destination.trigger_churn_threshold !== null) && (
            <div className="flex flex-wrap gap-1">
              {destination.trigger_segments.map((seg) => (
                <span
                  key={seg}
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${SEGMENT_COLORS[seg]}`}
                >
                  {fr.destinations.segments[seg]}
                </span>
              ))}
              {destination.trigger_churn_threshold !== null && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                  {fr.destinations.churnThreshold(destination.trigger_churn_threshold)}
                </span>
              )}
            </div>
          )}

          {/* Last triggered */}
          <p className="text-xs text-muted-foreground">
            {lastTriggeredText
              ? fr.destinations.lastTriggered(lastTriggeredText)
              : fr.destinations.neverTriggered}
          </p>

          {/* Test result */}
          {showTestResult && (
            <DestinationTestResult
              isPending={testMutation.isPending}
              data={testMutation.data}
              error={testMutation.error}
            />
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={testMutation.isPending}
            >
              {testMutation.isPending
                ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                : <TestTube2 className="h-3.5 w-3.5 mr-1.5" />}
              {fr.destinations.actions.test}
            </Button>

            <Button variant="outline" size="sm" onClick={() => onEdit(destination)}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              {fr.destinations.actions.edit}
            </Button>

            <Button variant="outline" size="sm" onClick={() => onViewLogs(destination)}>
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              {fr.destinations.actions.viewLogs}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleToggle}
              disabled={toggleMutation.isPending}
            >
              {toggleMutation.isPending
                ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                : <Power className="h-3.5 w-3.5 mr-1.5" />}
              {destination.is_active
                ? fr.destinations.actions.deactivate
                : fr.destinations.actions.activate}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteAlert(true)}
              className="text-red-500 hover:text-red-600 hover:border-red-300 ml-auto"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              {fr.destinations.actions.delete}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{fr.destinations.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>{fr.destinations.deleteDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{fr.destinations.deleteCancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-500 hover:bg-red-600"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {fr.destinations.deleteConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function DestinationsList({
  destinations,
  onEdit,
  onViewLogs,
}: DestinationsListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {destinations.map((dest) => (
        <DestinationCard
          key={dest.id}
          destination={dest}
          onEdit={onEdit}
          onViewLogs={onViewLogs}
        />
      ))}
    </div>
  );
}
