import { useState } from 'react';
import { Check, X, Loader2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { fr } from '@/i18n/fr';
import {
  usePlaybookExecutions,
  useApproveExecution,
  useRejectExecution,
} from '@/hooks/usePlaybooks';
import type { PlaybookExecutionRow } from '@/lib/types/playbook';

interface Props {
  playbookId: string;
  automationType: string;
  requiresApproval: boolean;
}

/** Execution status badge with color */
function ExecutionStatusBadge({ status }: { status: string }) {
  const label = fr.playbooks.executionStatusLabels[status] ?? status;

  const variantMap: Record<string, 'outline' | 'secondary' | 'default' | 'destructive'> = {
    pending: 'outline',
    pending_approval: 'outline',
    running: 'secondary',
    completed: 'default',
    failed: 'destructive',
    cancelled: 'outline',
  };
  const variant = variantMap[status] ?? 'outline';

  const colorMap: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    pending_approval: 'bg-amber-100 text-amber-800 border-amber-200',
    running: 'bg-blue-100 text-blue-800 border-blue-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    failed: 'bg-red-100 text-red-800 border-red-200',
    cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  return (
    <Badge variant={variant} className={colorMap[status] ?? ''}>
      {label}
    </Badge>
  );
}

/** A single pending execution card with approve/reject buttons */
function PendingExecutionCard({
  execution,
  playbookId,
}: {
  execution: PlaybookExecutionRow;
  playbookId: string;
}) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const approveMut = useApproveExecution();
  const rejectMut = useRejectExecution();

  const handleApprove = () => {
    approveMut.mutate({ playbookId, executionId: execution.id });
  };

  const handleReject = () => {
    rejectMut.mutate(
      { playbookId, executionId: execution.id, reason: rejectReason || undefined },
      {
        onSuccess: () => {
          setRejectOpen(false);
          setRejectReason('');
        },
      },
    );
  };

  const isPending = approveMut.isPending || rejectMut.isPending;

  return (
    <>
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {fr.playbooks.executionDate}{' '}
              {execution.started_at ? fr.format.dateTime(execution.started_at) : fr.format.dateTime(execution.created_at)}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <ExecutionStatusBadge status={execution.status} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={handleApprove}
            disabled={isPending}
          >
            {approveMut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Check className="h-4 w-4 mr-1" />
            )}
            {approveMut.isPending ? fr.playbooks.approving : fr.playbooks.approve}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => setRejectOpen(true)}
            disabled={isPending}
          >
            <X className="h-4 w-4 mr-1" />
            {fr.playbooks.reject}
          </Button>
        </div>
      </div>

      {/* Reject dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{fr.playbooks.rejectDialogTitle}</DialogTitle>
            <DialogDescription>
              {fr.playbooks.executionDate}{' '}
              {execution.started_at ? fr.format.dateTime(execution.started_at) : fr.format.dateTime(execution.created_at)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">{fr.playbooks.rejectReasonLabel}</label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={fr.playbooks.rejectReasonPlaceholder}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              {fr.common.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectMut.isPending}
            >
              {rejectMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {rejectMut.isPending ? fr.playbooks.rejecting : fr.playbooks.reject}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Section showing pending executions for semi_automated playbooks.
 * Also displays execution history as a simple table.
 */
export default function PlaybookPendingApprovals({ playbookId, automationType, requiresApproval }: Props) {
  const { data: executions } = usePlaybookExecutions(playbookId);

  // Only show for semi_automated playbooks that require approval
  if (automationType !== 'semi_automated' || !requiresApproval) return null;

  const pendingExecutions = (executions ?? []).filter(
    (e) => e.status === 'pending' || e.status === ('pending_approval' as PlaybookExecutionRow['status']),
  );

  const historyExecutions = (executions ?? []).filter(
    (e) => e.status !== 'pending' && e.status !== ('pending_approval' as PlaybookExecutionRow['status']),
  );

  if (pendingExecutions.length === 0 && historyExecutions.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Pending approvals */}
      {pendingExecutions.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              {fr.playbooks.pendingApproval}
              <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 ml-1">
                {pendingExecutions.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingExecutions.map((exec) => (
              <PendingExecutionCard
                key={exec.id}
                execution={exec}
                playbookId={playbookId}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Execution history */}
      {historyExecutions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{fr.playbooks.executionHistory}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {historyExecutions.slice(0, 20).map((exec) => (
                <div key={exec.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                  <span className="text-muted-foreground">
                    {exec.started_at ? fr.format.dateTime(exec.started_at) : fr.format.dateTime(exec.created_at)}
                  </span>
                  <ExecutionStatusBadge status={exec.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
