import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowLeft, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { fr } from '@/i18n/fr';
import DestinationsList from '@/components/destinations/DestinationsList';
import DestinationForm from '@/components/destinations/DestinationForm';
import type { DestinationFormPayload } from '@/components/destinations/DestinationForm';
import DestinationLogs from '@/components/destinations/DestinationLogs';
import {
  useDestinations,
  useCreateDestination,
  useUpdateDestination,
} from '@/hooks/useWebhookDestinations';
import type { OutboundWebhookDestination } from '@/lib/types/webhook-destinations';

export default function WebhookDestinations() {
  const { data: destinations, isLoading, isError } = useDestinations();
  const createMutation = useCreateDestination();
  const updateMutation = useUpdateDestination();

  const [formOpen, setFormOpen] = useState(false);
  const [editingDest, setEditingDest] = useState<OutboundWebhookDestination | null>(null);
  const [logsDest, setLogsDest] = useState<OutboundWebhookDestination | null>(null);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleOpenCreate = () => {
    setEditingDest(null);
    setFormOpen(true);
  };

  const handleEdit = (dest: OutboundWebhookDestination) => {
    setEditingDest(dest);
    setFormOpen(true);
  };

  const handleSave = (payload: DestinationFormPayload) => {
    if (editingDest) {
      const { secret_header_value, ...rest } = payload;
      const patchPayload = secret_header_value
        ? { ...rest, secret_header_value }
        : rest;
      updateMutation.mutate(
        { id: editingDest.id, ...patchPayload },
        { onSuccess: () => setFormOpen(false) },
      );
    } else {
      createMutation.mutate(payload, { onSuccess: () => setFormOpen(false) });
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb */}
      <div>
        <Link to="/settings">
          <Button variant="ghost" size="sm" className="-ml-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            {fr.nav.settings}
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{fr.destinations.title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{fr.destinations.subtitle}</p>
        </div>
        <Button onClick={handleOpenCreate} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          {fr.destinations.add}
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => <Skeleton key={i} className="h-52 w-full rounded-xl" />)}
        </div>
      )}

      {/* Error */}
      {isError && (
        <p className="text-sm text-red-500 text-center py-10">{fr.common.error}</p>
      )}

      {/* Empty state */}
      {!isLoading && !isError && destinations?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Zap className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-lg">{fr.destinations.emptyTitle}</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm leading-relaxed">
              {fr.destinations.emptyDesc}
            </p>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {fr.destinations.add}
          </Button>
        </div>
      )}

      {/* List */}
      {!isLoading && !isError && destinations && destinations.length > 0 && (
        <DestinationsList
          destinations={destinations}
          onEdit={handleEdit}
          onViewLogs={(dest) => setLogsDest(dest)}
        />
      )}

      {/* Form dialog */}
      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open && !isSaving) setFormOpen(false);
        }}
      >
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>
              {editingDest
                ? fr.destinations.form.editTitle
                : fr.destinations.form.createTitle}
            </DialogTitle>
          </DialogHeader>
          <DestinationForm
            destination={editingDest ?? undefined}
            onSave={handleSave}
            onCancel={() => setFormOpen(false)}
            isSaving={isSaving}
          />
        </DialogContent>
      </Dialog>

      {/* Logs dialog */}
      <Dialog
        open={!!logsDest}
        onOpenChange={(open) => {
          if (!open) setLogsDest(null);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {fr.destinations.logs.title}
              {logsDest && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  — {logsDest.name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {logsDest && <DestinationLogs destinationId={logsDest.id} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
