import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Pencil, Trash2, FlaskConical, ScrollText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useT } from '@/lib/i18n/useT';
import type { PlaybookDestination } from '@/lib/types/playbook-destination';

interface Props {
  destinations: PlaybookDestination[];
  testingId: string | null;
  onEdit: (dest: PlaybookDestination) => void;
  onDelete: (id: string) => void;
  onTest: (dest: PlaybookDestination) => void;
  onViewLogs: (dest: PlaybookDestination) => void;
}

export default function PlaybookDestinationsList({
  destinations,
  testingId,
  onEdit,
  onDelete,
  onTest,
  onViewLogs,
}: Props) {
  const fr = useT();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const t = fr.playbookDestinations;

  const canTest = (dest: PlaybookDestination) =>
    dest.is_active && !!dest.api_key_vault_key;

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>{t.connector}</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>{t.lastTriggered}</TableHead>
            <TableHead>{t.triggerSegments}</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {destinations.map((dest) => (
            <TableRow key={dest.id}>
              <TableCell className="font-medium">{dest.name}</TableCell>

              <TableCell>
                <Badge
                  variant="secondary"
                  className={t.connectorColors[dest.connector] ?? 'bg-gray-100 text-gray-700'}
                >
                  {t.connectors[dest.connector] ?? dest.connector}
                </Badge>
              </TableCell>

              <TableCell>
                <Badge variant={dest.is_active ? 'default' : 'secondary'}>
                  {dest.is_active ? t.active : t.inactive}
                </Badge>
              </TableCell>

              <TableCell className="text-sm text-muted-foreground">
                {dest.last_triggered_at
                  ? formatDistanceToNow(new Date(dest.last_triggered_at), {
                      addSuffix: true,
                      locale: enUS,
                    })
                  : t.neverTriggered}
              </TableCell>

              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {dest.trigger_segments.map((seg) => (
                    <Badge key={seg} variant="outline" className="text-xs">
                      {t.segments[seg] ?? seg}
                    </Badge>
                  ))}
                  {dest.trigger_churn_threshold !== null && (
                    <Badge variant="outline" className="text-xs">
                      Churn ≥ {dest.trigger_churn_threshold}%
                    </Badge>
                  )}
                  {dest.trigger_on_invoice_past_due && (
                    <Badge variant="outline" className="text-xs">
                      Facture en retard
                    </Badge>
                  )}
                  {dest.trigger_segments.length === 0 &&
                    dest.trigger_churn_threshold === null &&
                    !dest.trigger_on_invoice_past_due && (
                      <span className="text-xs text-muted-foreground">{t.noTrigger}</span>
                    )}
                </div>
              </TableCell>

              <TableCell>
                <div className="flex justify-end gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!canTest(dest) || testingId === dest.id}
                          onClick={() => onTest(dest)}
                        >
                          {testingId === dest.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <FlaskConical className="h-4 w-4" />
                          )}
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {!canTest(dest) && (
                      <TooltipContent>{t.testDisabled}</TooltipContent>
                    )}
                  </Tooltip>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewLogs(dest)}
                  >
                    <ScrollText className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(dest)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setConfirmDeleteId(dest.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog
        open={!!confirmDeleteId}
        onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>{t.deleteDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{fr.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmDeleteId) onDelete(confirmDeleteId);
                setConfirmDeleteId(null);
              }}
            >
              {fr.common.delete ?? 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
