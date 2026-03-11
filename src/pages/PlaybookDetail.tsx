import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { fr } from '@/i18n/fr';
import { useAuth } from '@/contexts/AuthContext';
import {
  usePlaybook,
  usePlaybookFullDetail,
  useUpdatePlaybook,
} from '@/hooks/usePlaybooks';
import PlaybookDetailHeader from '@/components/playbooks/PlaybookDetailHeader';
import PlaybookStatusBanner from '@/components/playbooks/PlaybookStatusBanner';
import PlaybookAffectedAccounts from '@/components/playbooks/PlaybookAffectedAccounts';
import PlaybookActionsSection from '@/components/playbooks/PlaybookActionsSection';
import PlaybookConditionsSection from '@/components/playbooks/PlaybookConditionsSection';
import PlaybookExecutionStats from '@/components/playbooks/PlaybookExecutionStats';
import PlaybookForm from '@/components/playbooks/PlaybookForm';
import ExecutePlaybookModal from '@/components/playbooks/ExecutePlaybookModal';
import type { UpdatePlaybookPayload } from '@/lib/types/playbook';

export default function PlaybookDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Load both: legacy playbook (for edit form + workflow redirect) and full detail (for display)
  const { data: playbook, isLoading: legacyLoading } = usePlaybook(id);
  const { data: fullDetail, isLoading: detailLoading, error } = usePlaybookFullDetail(id);
  const updateMutation = useUpdatePlaybook();

  const [isEditing, setIsEditing] = useState(false);
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const hasRedirectedRef = useRef(false);

  // Redirect workflows to their dedicated page (only once)
  useEffect(() => {
    if (playbook?.is_workflow && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      navigate(`/workflows/${id}`, { replace: true });
    }
  }, [playbook, id, navigate]);

  const isLoading = legacyLoading || detailLoading;

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !fullDetail) {
    return (
      <div className="space-y-6 p-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/playbooks')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Card className="border-destructive">
          <CardContent className="p-6">
            <p className="text-destructive text-sm">
              {fr.common.error} : {(error as Error)?.message ?? 'Playbook introuvable'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleEditSubmit = (payload: UpdatePlaybookPayload) => {
    updateMutation.mutate(
      { id: fullDetail.playbook.id, payload },
      { onSuccess: () => setIsEditing(false) },
    );
  };

  // Edit mode — show the form
  if (isEditing && playbook) {
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
            key={playbook.updated_at}
            mode="edit"
            initialData={playbook}
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

  // Narrative layout — no tabs
  return (
    <div className="space-y-6 p-6">
      {/* ZONE 1 — Header with actions */}
      <PlaybookDetailHeader
        playbook={fullDetail.playbook}
        affectedSummary={fullDetail.affected_accounts_summary}
        onEdit={() => setIsEditing(true)}
        onExecute={() => setShowExecuteModal(true)}
      />

      {/* ZONE 2 — Status banner */}
      <PlaybookStatusBanner
        status={fullDetail.playbook.status}
        affectedSummary={fullDetail.affected_accounts_summary}
      />

      {/* ZONE 3 — Affected accounts + export */}
      <PlaybookAffectedAccounts
        summary={fullDetail.affected_accounts_summary}
        playbookId={fullDetail.playbook.id}
      />

      {/* ZONE 4 — Actions sequence */}
      <PlaybookActionsSection actions={fullDetail.actions} />

      {/* ZONE 5 — Trigger conditions */}
      <PlaybookConditionsSection conditions={fullDetail.conditions} />

      {/* ZONE 6 — Execution stats + metadata */}
      <PlaybookExecutionStats
        playbook={fullDetail.playbook}
        stats={fullDetail.stats}
      />

      {/* Execute modal */}
      <ExecutePlaybookModal
        open={showExecuteModal}
        onOpenChange={setShowExecuteModal}
        playbookId={fullDetail.playbook.id}
        organizationId={user?.organization_id || ''}
      />
    </div>
  );
}
