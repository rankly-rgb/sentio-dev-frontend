import { useState, useEffect, useRef, useMemo } from 'react';
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
import PlaybookPendingApprovals from '@/components/playbooks/PlaybookPendingApprovals';
import ExecutePlaybookModal from '@/components/playbooks/ExecutePlaybookModal';
import type { UpdatePlaybookPayload, PlaybookFullDetail } from '@/lib/types/playbook';
import { buildFullDetailFromPlaybook } from '@/lib/types/playbook';

/** Validate that the RPC response has the expected nested shape */
function isValidFullDetail(d: unknown): d is PlaybookFullDetail {
  if (!d || typeof d !== 'object') return false;
  const obj = d as Record<string, unknown>;
  if (!obj.playbook || typeof obj.playbook !== 'object') return false;
  if (!obj.stats || typeof obj.stats !== 'object') return false;
  if (!obj.affected_accounts_summary || typeof obj.affected_accounts_summary !== 'object') return false;
  const summary = obj.affected_accounts_summary as Record<string, unknown>;
  if (!summary.by_urgency || typeof summary.by_urgency !== 'object') return false;
  const pb = obj.playbook as Record<string, unknown>;
  if (typeof pb.id !== 'string' || typeof pb.status !== 'string') return false;
  // Must have either 'name' (RPC remapped) or fall back
  if (typeof pb.name !== 'string' && typeof pb.title !== 'string') return false;
  return true;
}

/** Normalize RPC response — backend may use DB column names instead of remapped ones */
function normalizeRpcDetail(d: PlaybookFullDetail): PlaybookFullDetail {
  const pb = d.playbook as unknown as Record<string, unknown>;
  return {
    ...d,
    playbook: {
      ...d.playbook,
      // Handle both DB column names and remapped names
      name: (pb.name as string) || (pb.title as string) || '',
      automation_type: (pb.automation_type ?? pb.playbook_type ?? 'manual') as PlaybookFullDetail['playbook']['automation_type'],
      category: (pb.category ?? pb.template_category ?? '') as string,
      description: (pb.description ?? '') as string,
      requires_approval: (pb.requires_approval ?? false) as boolean,
    },
    affected_accounts_summary: {
      total: d.affected_accounts_summary?.total ?? 0,
      mrr_at_risk_cents: d.affected_accounts_summary?.mrr_at_risk_cents ?? 0,
      by_urgency: {
        urgent: d.affected_accounts_summary?.by_urgency?.urgent ?? 0,
        watch: d.affected_accounts_summary?.by_urgency?.watch ?? 0,
        stable: d.affected_accounts_summary?.by_urgency?.stable ?? 0,
      },
    },
    // Ensure actions and conditions are always arrays (RPC may return null/object)
    actions: Array.isArray(d.actions) ? d.actions : [],
    conditions: Array.isArray(d.conditions) ? d.conditions : [],
  };
}

export default function PlaybookDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Legacy playbook (always available — for edit form, workflow redirect, and fallback)
  const { data: playbook, isLoading: legacyLoading, error: legacyError } = usePlaybook(id);
  // Full detail RPC (may not exist yet in backend — optional)
  const { data: rpcDetail } = usePlaybookFullDetail(id);
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

  // Use RPC data if valid, otherwise build from legacy playbook
  const fullDetail = useMemo(() => {
    if (rpcDetail && isValidFullDetail(rpcDetail)) {
      return normalizeRpcDetail(rpcDetail);
    }
    if (playbook) return buildFullDetailFromPlaybook(playbook);
    return null;
  }, [rpcDetail, playbook]);

  if (legacyLoading) {
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

  if (legacyError || !fullDetail) {
    return (
      <div className="space-y-6 p-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/playbooks')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Card className="border-destructive">
          <CardContent className="p-6">
            <p className="text-destructive text-sm">
              {fr.common.error} : {(legacyError as Error)?.message ?? 'Playbook introuvable'}
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

      {/* ZONE 2b — Pending approvals (semi_automated only) */}
      <PlaybookPendingApprovals
        playbookId={fullDetail.playbook.id}
        automationType={fullDetail.playbook.automation_type}
        requiresApproval={fullDetail.playbook.requires_approval}
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
