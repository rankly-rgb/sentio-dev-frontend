import { useState } from 'react';
import { getAccountLabel } from '@/lib/account-display';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, ClipboardList } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useT } from '@/lib/i18n/useT';
import { useAuth } from '@/contexts/AuthContext';
import { usePendingApprovals, useApproveQueueItem } from '@/hooks/usePlaybookDestinations';
import type { PlaybookApprovalQueueItem } from '@/lib/types/playbook-destination';

export default function PlaybookApprovals() {
  const fr = useT();
  const { user } = useAuth();
  const currency = user?.currency ?? 'usd';
  const { data: items, isLoading, isError } = usePendingApprovals();
  const approveMutation = useApproveQueueItem();

  const [rejectItem, setRejectItem] = useState<PlaybookApprovalQueueItem | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const t = fr.playbookApprovals;
  const segLabels = fr.playbookDestinations.segments;
  const connLabels = fr.playbookDestinations.connectors;

  const handleApprove = (item: PlaybookApprovalQueueItem) => {
    setProcessingId(item.id);
    approveMutation.mutate(
      { queue_item_id: item.id, action: 'approve' },
      {
        onSuccess: () => toast.success(t.approveSuccess),
        onError: (e) => toast.error(e.message),
        onSettled: () => setProcessingId(null),
      },
    );
  };

  const handleRejectConfirm = () => {
    if (!rejectItem) return;
    setProcessingId(rejectItem.id);
    approveMutation.mutate(
      {
        queue_item_id: rejectItem.id,
        action: 'reject',
        comment: rejectComment.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success(t.rejectSuccess);
          setRejectItem(null);
          setRejectComment('');
        },
        onError: (e) => toast.error(e.message),
        onSettled: () => setProcessingId(null),
      },
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb */}
      <div>
        <Link to="/playbooks">
          <Button variant="ghost" size="sm" className="-ml-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t.backToPlaybooks}
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t.subtitle}</p>
        </div>
        {items && items.length > 0 && (
          <Badge variant="destructive" className="shrink-0 text-sm px-3 py-1">
            {t.pendingCount(items.length)}
          </Badge>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      )}

      {/* Error */}
      {isError && (
        <p className="text-sm text-destructive text-center py-10">{fr.common.error}</p>
      )}

      {/* Empty */}
      {!isLoading && !isError && (!items || items.length === 0) && (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <ClipboardList className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-semibold text-foreground">{t.empty}</p>
        </div>
      )}

      {/* Table */}
      {!isLoading && !isError && items && items.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.account}</TableHead>
              <TableHead>{t.segment}</TableHead>
              <TableHead>{t.churnRisk}</TableHead>
              <TableHead>{t.mrr}</TableHead>
              <TableHead>{t.destination}</TableHead>
              <TableHead>{t.expiresIn}</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const isProcessing = processingId === item.id;
              return (
                <TableRow key={item.id}>
                  <TableCell className="text-sm">
                    {getAccountLabel(item)}
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {segLabels[item.segment] ?? item.segment}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-sm">
                    {item.churn_risk !== null
                      ? `${item.churn_risk}%`
                      : t.noChurnRisk}
                  </TableCell>

                  <TableCell className="text-sm">
                    {item.mrr_eur !== null
                      ? fr.format.currency(item.mrr_eur * 100, currency)
                      : t.noMrr}
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">
                        {item.destination_name ?? item.destination_id}
                      </span>
                      {item.destination_connector && (
                        <Badge
                          variant="secondary"
                          className={`text-xs w-fit ${fr.playbookDestinations.connectorColors[item.destination_connector] ?? ''}`}
                        >
                          {connLabels[item.destination_connector]}
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(item.expires_at), {
                      addSuffix: true,
                      locale: enUS,
                    })}
                  </TableCell>

                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-700 border-green-200 hover:bg-green-50"
                        disabled={isProcessing}
                        onClick={() => handleApprove(item)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1.5" />
                        {isProcessing ? t.approving : t.approve}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive border-destructive/20 hover:bg-destructive/5"
                        disabled={isProcessing}
                        onClick={() => {
                          setRejectItem(item);
                          setRejectComment('');
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-1.5" />
                        {t.reject}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Reject dialog */}
      <Dialog
        open={!!rejectItem}
        onOpenChange={(open) => {
          if (!open) {
            setRejectItem(null);
            setRejectComment('');
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t.rejectDialogTitle}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t.rejectDialogDesc}</p>
          {rejectItem && (
            <p className="text-sm bg-muted rounded px-3 py-2">
              {getAccountLabel(rejectItem)}
            </p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="reject-comment">{t.commentLabel}</Label>
            <Textarea
              id="reject-comment"
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder={t.commentPlaceholder}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectItem(null)}
              disabled={processingId === rejectItem?.id}
            >
              {fr.common.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={processingId === rejectItem?.id}
            >
              {processingId === rejectItem?.id ? t.rejecting : t.confirmReject}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
