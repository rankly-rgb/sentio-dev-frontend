import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { fr } from '@/i18n/fr';
import {
  usePlaybookDetail,
  usePlaybook,
  useUpdatePlaybook,
} from '@/hooks/usePlaybooks';
import PlaybookDetailHeader from '@/components/playbooks/PlaybookDetailHeader';
import PlaybookAffectedAccounts from '@/components/playbooks/PlaybookAffectedAccounts';
import PlaybookActionsSection from '@/components/playbooks/PlaybookActionsSection';
import PlaybookExecutionStats from '@/components/playbooks/PlaybookExecutionStats';
import PlaybookConfiguration from '@/components/playbooks/PlaybookConfiguration';
import PlaybookForm from '@/components/playbooks/PlaybookForm';
import ExecutePlaybookModal from '@/components/playbooks/ExecutePlaybookModal';
import type { UpdatePlaybookPayload } from '@/lib/types/playbook';

export default function PlaybookDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Single RPC call for all detail data
  const {
    data: detail,
    isLoading,
    error,
    refetch,
  } = usePlaybookDetail(id);

  // Legacy playbook needed for edit form only
  const { data: legacyPlaybook } = usePlaybook(id);
  const updateMutation = useUpdatePlaybook();

  const [isEditing, setIsEditing] = useState(false);
  const [showExecuteModal, setShowExecuteModal] = useState(false);

  // Loading state with skeleton placeholders
  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // Error state with retry button
  if (error || !detail) {
    return (
      <div className="space-y-6 p-6">
        <button
          onClick={() => navigate('/playbooks')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {fr.playbooks.backToList}
        </button>
        <Card className="border-destructive">
          <CardContent className="p-6 flex items-center justify-between">
            <p className="text-destructive text-sm">
              {fr.common.error} : {(error as Error)?.message ?? 'Playbook introuvable'}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Edit mode
  const handleEditSubmit = (payload: UpdatePlaybookPayload) => {
    updateMutation.mutate(
      { id: detail.playbook.id, payload },
      { onSuccess: () => setIsEditing(false) },
    );
  };

  if (isEditing && legacyPlaybook) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{fr.playbooks.editTitle}</h1>
        </div>
        <div className="max-w-3xl">
          <PlaybookForm
            key={legacyPlaybook.updated_at}
            mode="edit"
            initialData={legacyPlaybook}
            onSubmit={handleEditSubmit as (p: unknown) => void}
            isSubmitting={updateMutation.isPending}
          />
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setIsEditing(false)}
          >
            {fr.playbooks.form.cancel}
          </Button>
        </div>
      </div>
    );
  }

  // Main two-column layout
  return (
    <div className="space-y-6 p-6">
      {/* Header — full width */}
      <PlaybookDetailHeader
        playbook={detail.playbook}
        onEdit={() => setIsEditing(true)}
        onExecute={() => setShowExecuteModal(true)}
      />

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          <PlaybookAffectedAccounts eligible={detail.eligible_accounts} />
          <PlaybookActionsSection actions={detail.actions} />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <PlaybookExecutionStats stats={detail.execution_stats} />
          <PlaybookConfiguration playbook={detail.playbook} />
        </div>
      </div>

      {/* Execute modal */}
      <ExecutePlaybookModal
        open={showExecuteModal}
        onOpenChange={setShowExecuteModal}
        playbookId={detail.playbook.id}
        lastExecutedAt={detail.execution_stats.last_executed_at}
      />
    </div>
  );
}
