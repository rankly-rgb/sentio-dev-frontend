import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowLeft, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useT } from '@/lib/i18n/useT';
import PlaybookDestinationsList from '@/components/playbook-destinations/PlaybookDestinationsList';
import PlaybookDestinationForm from '@/components/playbook-destinations/PlaybookDestinationForm';
import type { DestinationFormPayload } from '@/components/playbook-destinations/PlaybookDestinationForm';
import PlaybookDestinationLogs from '@/components/playbook-destinations/PlaybookDestinationLogs';
import {
  usePlaybookDestinations,
  useCreatePlaybookDestination,
  useUpdatePlaybookDestination,
  useDeletePlaybookDestination,
  useTestPlaybookDestination,
} from '@/hooks/usePlaybookDestinations';
import type { PlaybookDestination, UpdatePlaybookDestinationPayload } from '@/lib/types/playbook-destination';

export default function PlaybookDestinations() {
  const fr = useT();
  const { data: destinations, isLoading, isError } = usePlaybookDestinations();
  const createMutation = useCreatePlaybookDestination();
  const updateMutation = useUpdatePlaybookDestination();
  const deleteMutation = useDeletePlaybookDestination();
  const testMutation = useTestPlaybookDestination();

  const [formOpen, setFormOpen] = useState(false);
  const [editingDest, setEditingDest] = useState<PlaybookDestination | null>(null);
  const [logsDest, setLogsDest] = useState<PlaybookDestination | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  const t = fr.playbookDestinations;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleOpenCreate = () => {
    setEditingDest(null);
    setFormOpen(true);
  };

  const handleEdit = (dest: PlaybookDestination) => {
    setEditingDest(dest);
    setFormOpen(true);
  };

  const handleSave = (payload: DestinationFormPayload) => {
    if (editingDest) {
      const { id, ...rest } = payload as { id: string } & UpdatePlaybookDestinationPayload;
      updateMutation.mutate(
        { id, ...rest },
        { onSuccess: () => setFormOpen(false) },
      );
    } else {
      createMutation.mutate(
        payload as Parameters<typeof createMutation.mutate>[0],
        { onSuccess: () => setFormOpen(false) },
      );
    }
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleTest = (dest: PlaybookDestination) => {
    setTestingId(dest.id);
    testMutation.mutate(dest.id, {
      onSuccess: (res) => {
        if (res.success) {
          toast.success(`${t.testSuccess} (HTTP ${res.http_status})`);
        } else {
          toast.error(`${t.testError} — HTTP ${res.http_status}: ${res.response.slice(0, 120)}`);
        }
      },
      onError: (e) => {
        toast.error(`${t.testError} : ${e.message}`);
      },
      onSettled: () => setTestingId(null),
    });
  };

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb */}
      <div>
        <Link to="/playbooks">
          <Button variant="ghost" size="sm" className="-ml-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            {fr.playbooks.backToList}
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t.subtitle}</p>
        </div>
        <Button onClick={handleOpenCreate} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          {t.add}
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
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
            <p className="font-semibold text-foreground text-lg">{t.emptyTitle}</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm leading-relaxed">
              {t.emptyDesc}
            </p>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {t.add}
          </Button>
        </div>
      )}

      {/* List */}
      {!isLoading && !isError && destinations && destinations.length > 0 && (
        <PlaybookDestinationsList
          destinations={destinations}
          testingId={testingId}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onTest={handleTest}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDest ? t.form.editTitle : t.form.createTitle}
            </DialogTitle>
          </DialogHeader>
          <PlaybookDestinationForm
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
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t.logs.title}
              {logsDest && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  — {logsDest.name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {logsDest && <PlaybookDestinationLogs destinationId={logsDest.id} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
