import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Zap,
  Archive,
  Pencil,
  Play,
  Loader2,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useT } from '@/lib/i18n/useT';
import PlaybookStatusBadge from '@/components/playbooks/PlaybookStatusBadge';
import { useArchivePlaybook, useTransitionPlaybookStatus } from '@/hooks/usePlaybooks';
import type { PlaybookDetailPlaybook } from '@/lib/types/playbook';

const CATEGORY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 hover:bg-red-100',
  standard: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
};

interface Props {
  playbook: PlaybookDetailPlaybook;
  onEdit: () => void;
  onExecute: () => void;
}

export default function PlaybookDetailHeader({
  playbook,
  onEdit,
  onExecute,
}: Props) {
  const fr = useT();
  const navigate = useNavigate();
  const transitionMutation = useTransitionPlaybookStatus();
  const archiveMutation = useArchivePlaybook();
  const [_activateConfirm, setActivateConfirm] = useState(false);

  const isMutating = transitionMutation.isPending || archiveMutation.isPending;

  const handleActivate = () => {
    transitionMutation.mutate(
      { id: playbook.id, targetStatus: 'active' },
      {
        onSuccess: () => {
          setActivateConfirm(false);
          toast.success('Playbook activé avec succès');
        },
      },
    );
  };

  const handleDeactivate = () => {
    transitionMutation.mutate(
      { id: playbook.id, targetStatus: 'draft' },
      { onSuccess: () => toast.success('Playbook désactivé') },
    );
  };

  const handleArchive = () => {
    archiveMutation.mutate(playbook.id, {
      onSuccess: () => navigate('/playbooks'),
    });
  };

  const categoryKey = playbook.category?.toLowerCase() || '';
  const categoryLabel =
    fr.playbooks.categoryBadge[categoryKey] ??
    fr.playbooks.category[categoryKey as keyof typeof fr.playbooks.category] ??
    playbook.category;
  const categoryColor = CATEGORY_COLORS[categoryKey] ?? CATEGORY_COLORS.standard;

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <button
        onClick={() => navigate('/playbooks')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {fr.playbooks.backToList}
      </button>

      {/* Title row */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{playbook.display_name}</h1>
            <PlaybookStatusBadge status={playbook.status} />
            {playbook.category && (
              <Badge variant="secondary" className={categoryColor}>
                {categoryLabel}
              </Badge>
            )}
          </div>
          {playbook.display_description && (
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              {playbook.display_description}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {playbook.status === 'draft' && (
            <>
              <Button size="sm" onClick={handleActivate} disabled={isMutating}>
                {transitionMutation.isPending ? (
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

          {playbook.status === 'active' && (
            <>
              <Button size="sm" variant="outline" onClick={handleDeactivate} disabled={isMutating}>
                {transitionMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
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

          {playbook.status === 'archived' && (
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              {fr.playbooks.edit}
            </Button>
          )}
        </div>
      </div>

      {/* Draft info banner */}
      {playbook.status === 'draft' && (
        <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <Info className="h-4 w-4 shrink-0" />
          <span>{fr.playbooks.bannerDraft(0)}</span>
        </div>
      )}
    </div>
  );
}
