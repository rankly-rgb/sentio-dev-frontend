import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Pause,
  Archive,
  Pencil,
  Zap,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
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
import { fr } from '@/i18n/fr';
import { useAuth } from '@/contexts/AuthContext';
import {
  usePlaybook,
  usePlaybookExecutions,
  useUpdatePlaybook,
  useArchivePlaybook,
} from '@/hooks/usePlaybooks';
import PlaybookStatusBadge from '@/components/playbooks/PlaybookStatusBadge';
import PriorityBadge from '@/components/playbooks/PriorityBadge';
import ConditionDisplay from '@/components/playbooks/ConditionDisplay';
import ExecutionTimeline from '@/components/playbooks/ExecutionTimeline';
import PlaybookForm from '@/components/playbooks/PlaybookForm';
import ExecutePlaybookModal from '@/components/playbooks/ExecutePlaybookModal';
import StepTimeline from '@/components/workflows/StepTimeline';
import type { UpdatePlaybookPayload } from '@/lib/types/playbook';

export default function WorkflowDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const { data: playbook, isLoading, error } = usePlaybook(id);
  const { data: executions, isLoading: execLoading } = usePlaybookExecutions(id);
  const updateMutation = useUpdatePlaybook();
  const archiveMutation = useArchivePlaybook();

  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');
  const [showExecuteModal, setShowExecuteModal] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !playbook) {
    return (
      <div className="space-y-6 p-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/playbooks')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Card className="border-destructive">
          <CardContent className="p-6">
            <p className="text-destructive text-sm">
              {fr.common.error} : {(error as Error)?.message ?? 'Workflow introuvable'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleStatusChange = (status: 'active' | 'paused') => {
    updateMutation.mutate({ id: playbook.id, payload: { status } });
  };

  const handleArchive = () => {
    archiveMutation.mutate(playbook.id, {
      onSuccess: () => navigate('/playbooks'),
    });
  };

  const exitEditMode = () => {
    setIsEditing(false);
    searchParams.delete('edit');
    setSearchParams(searchParams, { replace: true });
  };

  const handleEditSubmit = (payload: UpdatePlaybookPayload) => {
    updateMutation.mutate(
      { id: playbook.id, payload },
      { onSuccess: exitEditMode },
    );
  };

  const isMutating = updateMutation.isPending || archiveMutation.isPending;
  const stepCount = playbook.steps?.length ?? 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/playbooks')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{playbook.title}</h1>
              <PlaybookStatusBadge status={playbook.status} />
              <PriorityBadge priority={playbook.priority} />
              <Badge variant="secondary" className="text-xs">
                {fr.workflows.workflowBadge}
              </Badge>
            </div>
            {playbook.description && (
              <p className="text-sm text-muted-foreground mt-1">{playbook.description}</p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {playbook.status === 'draft' && (
            <Button
              size="sm"
              onClick={() => handleStatusChange('active')}
              disabled={isMutating}
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              {fr.playbooks.activate}
            </Button>
          )}
          {playbook.status === 'active' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusChange('paused')}
              disabled={isMutating}
            >
              <Pause className="h-4 w-4 mr-2" />
              {fr.playbooks.pause}
            </Button>
          )}
          {playbook.status === 'paused' && (
            <Button
              size="sm"
              onClick={() => handleStatusChange('active')}
              disabled={isMutating}
            >
              <Play className="h-4 w-4 mr-2" />
              {fr.playbooks.activate}
            </Button>
          )}

          {playbook.status !== 'archived' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowExecuteModal(true)}
              >
                <Play className="h-4 w-4 mr-2" />
                {fr.playbooks.execute}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const next = !isEditing;
                  setIsEditing(next);
                  if (!next) {
                    searchParams.delete('edit');
                    setSearchParams(searchParams, { replace: true });
                  }
                }}
              >
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
                    <AlertDialogAction onClick={handleArchive}>{fr.playbooks.archive}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">{fr.playbooks.kpi.eligible}</p>
            <p className="text-xl font-bold">{playbook.accounts_eligible ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">{fr.playbooks.kpi.targeted}</p>
            <p className="text-xl font-bold">{playbook.accounts_targeted ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">{fr.playbooks.kpi.reached}</p>
            <p className="text-xl font-bold">{playbook.accounts_reached ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">{fr.playbooks.kpi.converted}</p>
            <p className="text-xl font-bold">{playbook.accounts_converted ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">{fr.playbooks.kpi.mrrRecovered}</p>
            <p className="text-xl font-bold">{fr.format.currency(playbook.mrr_recovered_cents ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">{fr.playbooks.kpi.mrrExpanded}</p>
            <p className="text-xl font-bold">{fr.format.currency(playbook.mrr_expanded_cents ?? 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Execution stats */}
      {playbook.execution_stats && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{fr.playbooks.executionStats}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 flex-wrap text-sm">
              <div>
                <span className="text-muted-foreground">{fr.playbooks.totalExecutions} : </span>
                <span className="font-medium">{playbook.execution_stats.total}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{fr.playbooks.completedExec} : </span>
                <span className="font-medium text-emerald-600">{playbook.execution_stats.completed}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{fr.playbooks.failedExec} : </span>
                <span className="font-medium text-destructive">{playbook.execution_stats.failed}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{fr.playbooks.runningExec} : </span>
                <span className="font-medium">{playbook.execution_stats.running}</span>
              </div>
              {playbook.execution_stats.last_executed_at && (
                <div>
                  <span className="text-muted-foreground">{fr.playbooks.lastRun} : </span>
                  <span className="font-medium">
                    {fr.format.dateTime(playbook.execution_stats.last_executed_at)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit mode or tabs */}
      {isEditing ? (
        <div className="max-w-3xl">
          <PlaybookForm
            mode="edit"
            initialData={playbook}
            isWorkflow
            onSubmit={handleEditSubmit as (p: unknown) => void}
            isSubmitting={updateMutation.isPending}
          />
          <Button
            variant="outline"
            className="mt-4"
            onClick={exitEditMode}
          >
            {fr.playbooks.form.cancel}
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="steps">
          <TabsList>
            <TabsTrigger value="steps">
              {fr.workflows.steps}
              {stepCount > 0 && (
                <span className="ml-1.5 text-xs text-muted-foreground">({stepCount})</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="conditions">{fr.playbooks.conditions}</TabsTrigger>
            <TabsTrigger value="executions">{fr.playbooks.executions}</TabsTrigger>
            <TabsTrigger value="details">{fr.playbooks.details}</TabsTrigger>
          </TabsList>

          <TabsContent value="steps" className="mt-4">
            <Card>
              <CardContent className="p-6">
                <StepTimeline steps={playbook.steps ?? []} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conditions" className="mt-4">
            <Card>
              <CardContent className="p-6">
                <ConditionDisplay conditionGroup={playbook.eligibility_criteria} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="executions" className="mt-4">
            <Card>
              <CardContent className="p-6">
                <ExecutionTimeline
                  executions={executions ?? []}
                  isLoading={execLoading}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="mt-4">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">{fr.playbooks.form.type} : </span>
                    <span className="font-medium">{fr.playbooks.type[playbook.playbook_type]}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{fr.playbooks.form.priority} : </span>
                    <PriorityBadge priority={playbook.priority} />
                  </div>
                  {playbook.template_category && (
                    <div>
                      <span className="text-muted-foreground">{fr.playbooks.form.category} : </span>
                      <span className="font-medium">{fr.playbooks.category[playbook.template_category]}</span>
                    </div>
                  )}
                  {playbook.segment_id && (
                    <div>
                      <span className="text-muted-foreground">{fr.playbooks.form.segment} : </span>
                      <span className="font-medium">
                        {fr.playbooks.segments[playbook.segment_id as keyof typeof fr.playbooks.segments] ?? playbook.segment_id}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">{fr.playbooks.form.automated} : </span>
                    <span className="font-medium">{playbook.is_automated ? 'Oui' : 'Non'}</span>
                  </div>
                  {playbook.execution_frequency && (
                    <div>
                      <span className="text-muted-foreground">{fr.playbooks.form.frequency} : </span>
                      <span className="font-medium">{playbook.execution_frequency}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">{fr.playbooks.form.requiresApproval} : </span>
                    <span className="font-medium">{playbook.requires_approval ? 'Oui' : 'Non'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Créé le : </span>
                    <span className="font-medium">{fr.format.dateTime(playbook.created_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Execute modal */}
      <ExecutePlaybookModal
        open={showExecuteModal}
        onOpenChange={setShowExecuteModal}
        playbookId={playbook.id}
        organizationId={user?.organization_id ?? ''}
      />
    </div>
  );
}
