import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Zap,
  Pause,
  Archive,
  Pencil,
  Play,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { fr } from '@/i18n/fr';
import PlaybookStatusBadge from '@/components/playbooks/PlaybookStatusBadge';
import PriorityBadge from '@/components/playbooks/PriorityBadge';
import { useUpdatePlaybook, useArchivePlaybook } from '@/hooks/usePlaybooks';
import type {
  PlaybookFullDetailPlaybook,
  PlaybookAffectedAccountsSummary,
  PlaybookStatus,
} from '@/lib/types/playbook';

interface Props {
  playbook: PlaybookFullDetailPlaybook;
  affectedSummary: PlaybookAffectedAccountsSummary;
  onEdit: () => void;
  onExecute: () => void;
}

export default function PlaybookDetailHeader({
  playbook,
  affectedSummary,
  onEdit,
  onExecute,
}: Props) {
  const navigate = useNavigate();
  const updateMutation = useUpdatePlaybook();
  const archiveMutation = useArchivePlaybook();
  const [activateOpen, setActivateOpen] = useState(false);

  const isMutating = updateMutation.isPending || archiveMutation.isPending;

  const handleStatusChange = (status: PlaybookStatus) => {
    updateMutation.mutate(
      { id: playbook.id, payload: { status } },
      {
        onSuccess: () => {
          if (status === 'active') {
            setActivateOpen(false);
            toast.success('Playbook activé avec succès');
          } else {
            toast.success('Playbook désactivé');
          }
        },
      },
    );
  };

  const handleArchive = () => {
    archiveMutation.mutate(playbook.id, {
      onSuccess: () => navigate('/playbooks'),
    });
  };

  const mrrFormatted = fr.format.currency(affectedSummary?.mrr_at_risk_cents ?? 0);
  const isFullyAutomated =
    !playbook.requires_approval && playbook.automation_type === 'automated';

  return (
    <>
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/playbooks')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{playbook.name}</h1>
              <PlaybookStatusBadge status={playbook.status} />
              <PriorityBadge priority={playbook.priority} />
            </div>
            {playbook.description && (
              <p className="text-sm text-muted-foreground mt-1">{playbook.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Draft → Activer + Exécuter + Modifier + Archiver */}
          {playbook.status === 'draft' && (
            <>
              <Button size="sm" onClick={() => setActivateOpen(true)} disabled={isMutating}>
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                {fr.playbooks.activate}
              </Button>
              <Button size="sm" variant="outline" onClick={onExecute}>
                <Play className="h-4 w-4 mr-2" />
                {fr.playbooks.execute}
              </Button>
              <Button size="sm" variant="outline" onClick={onEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                {fr.playbooks.edit}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline" className="text-destructive" disabled={isMutating}>
                    <Archive className="h-4 w-4 mr-2" />
                    {fr.playbooks.archive}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{fr.playbooks.confirmArchive}</AlertDialogTitle>
                    <AlertDialogDescription>{fr.playbooks.confirmArchiveDesc}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{fr.playbooks.form.cancel}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleArchive} disabled={archiveMutation.isPending}>
                      {fr.playbooks.archive}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}

          {/* Active → Désactiver + Exécuter + Modifier + Archiver */}
          {playbook.status === 'active' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange('draft')}
                disabled={isMutating}
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Pause className="h-4 w-4 mr-2" />
                )}
                {fr.playbooks.deactivate}
              </Button>
              <Button size="sm" variant="outline" onClick={onExecute}>
                <Play className="h-4 w-4 mr-2" />
                {fr.playbooks.execute}
              </Button>
              <Button size="sm" variant="outline" onClick={onEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                {fr.playbooks.edit}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline" className="text-destructive" disabled={isMutating}>
                    <Archive className="h-4 w-4 mr-2" />
                    {fr.playbooks.archive}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{fr.playbooks.confirmArchive}</AlertDialogTitle>
                    <AlertDialogDescription>{fr.playbooks.confirmArchiveDesc}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{fr.playbooks.form.cancel}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleArchive} disabled={archiveMutation.isPending}>
                      {fr.playbooks.archive}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}

          {/* Archived → Modifier seulement */}
          {playbook.status === 'archived' && (
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              {fr.playbooks.edit}
            </Button>
          )}
        </div>
      </div>

      {/* Activation confirmation modal */}
      <Dialog open={activateOpen} onOpenChange={setActivateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{fr.playbooks.activateModalTitle}</DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <span className="block">{fr.playbooks.activateModalBody}</span>
              <span className="flex items-start gap-2 text-amber-600">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  {fr.playbooks.activateModalImpact(affectedSummary.total, mrrFormatted)}
                </span>
              </span>
              <span className="block text-sm">
                {isFullyAutomated ? (
                  <span className="flex items-start gap-2 text-amber-600 font-medium">
                    <Zap className="h-4 w-4 shrink-0 mt-0.5" />
                    {fr.playbooks.activateModalAutoWarning}
                  </span>
                ) : (
                  fr.playbooks.activateModalApprovalNote(
                    fr.playbooks.type[playbook.automation_type] ?? playbook.automation_type,
                  )
                )}
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivateOpen(false)}>
              {fr.playbooks.form.cancel}
            </Button>
            <Button onClick={() => handleStatusChange('active')} disabled={updateMutation.isPending}>
              {updateMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {fr.playbooks.confirmActivation}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
