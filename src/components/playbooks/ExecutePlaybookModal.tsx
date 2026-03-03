import { useState } from 'react';
import { Loader2, Play, CheckCircle, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fr } from '@/i18n/fr';
import { useExecutePlaybook } from '@/hooks/usePlaybooks';
import type { ExecutePlaybookResponse } from '@/lib/types/playbook';

const SEGMENTS = [
  'champions', 'en_expansion', 'stables', 'a_risque_leger',
  'en_danger_critique', 'impayes', 'en_churn', 'nouveaux',
] as const;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playbookId: string;
  organizationId: string;
}

export default function ExecutePlaybookModal({ open, onOpenChange, playbookId, organizationId }: Props) {
  const [mode, setMode] = useState<'segment' | 'accounts'>('segment');
  const [segmentId, setSegmentId] = useState('');
  const [accountIdsRaw, setAccountIdsRaw] = useState('');
  const [cooldownHours, setCooldownHours] = useState(24);
  const [result, setResult] = useState<ExecutePlaybookResponse | null>(null);

  const { mutate, isPending } = useExecutePlaybook();

  const handleExecute = () => {
    const payload = {
      playbook_id: playbookId,
      organization_id: organizationId,
      execution_source: 'manual' as const,
      cooldown_hours: cooldownHours,
      ...(mode === 'segment'
        ? { segment_id: segmentId }
        : { account_ids: accountIdsRaw.split(',').map((id) => id.trim()).filter(Boolean) }),
    };

    mutate(payload, {
      onSuccess: (data) => setResult(data),
    });
  };

  const handleClose = () => {
    setResult(null);
    setMode('segment');
    setSegmentId('');
    setAccountIdsRaw('');
    setCooldownHours(24);
    onOpenChange(false);
  };

  const canSubmit =
    !isPending &&
    (mode === 'segment' ? !!segmentId : accountIdsRaw.trim().length > 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{fr.playbooks.executeModal.title}</DialogTitle>
          <DialogDescription>{fr.playbooks.executeModal.description}</DialogDescription>
        </DialogHeader>

        {result ? (
          /* Results */
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3">
              {result.success ? (
                <CheckCircle className="h-8 w-8 text-emerald-500" />
              ) : (
                <XCircle className="h-8 w-8 text-destructive" />
              )}
              <div>
                <p className="font-medium">
                  {result.success ? fr.playbooks.executeModal.success : 'Erreur'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {result.executions_created} {fr.playbooks.executeModal.executionsCreated}
                </p>
              </div>
            </div>
            {result.results && result.results.length > 0 && (
              <div className="text-xs space-y-1 max-h-40 overflow-y-auto">
                {result.results.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {r.status === 'completed' ? (
                      <CheckCircle className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-destructive" />
                    )}
                    <span className="font-mono">{r.account_id.slice(0, 8)}…</span>
                    <span className="text-muted-foreground">
                      {r.completed}/{r.steps} étapes
                    </span>
                  </div>
                ))}
              </div>
            )}
            <DialogFooter>
              <Button onClick={handleClose}>Fermer</Button>
            </DialogFooter>
          </div>
        ) : (
          /* Form */
          <div className="space-y-4 py-4">
            {/* Mode selection */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mode === 'segment' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('segment')}
              >
                {fr.playbooks.executeModal.bySegment}
              </Button>
              <Button
                type="button"
                variant={mode === 'accounts' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('accounts')}
              >
                {fr.playbooks.executeModal.byAccounts}
              </Button>
            </div>

            {mode === 'segment' ? (
              <div>
                <label className="text-sm font-medium">{fr.playbooks.form.segment}</label>
                <Select value={segmentId} onValueChange={setSegmentId}>
                  <SelectTrigger>
                    <SelectValue placeholder={fr.playbooks.form.noSegment} />
                  </SelectTrigger>
                  <SelectContent>
                    {SEGMENTS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {fr.playbooks.segments[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium">{fr.playbooks.executeModal.accountIds}</label>
                <Input
                  value={accountIdsRaw}
                  onChange={(e) => setAccountIdsRaw(e.target.value)}
                  placeholder={fr.playbooks.executeModal.accountIdsPlaceholder}
                />
              </div>
            )}

            {/* Cooldown */}
            <div>
              <label className="text-sm font-medium">{fr.playbooks.executeModal.cooldownHours}</label>
              <Input
                type="number"
                min={0}
                value={cooldownHours}
                onChange={(e) => setCooldownHours(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {fr.playbooks.executeModal.cooldownHelp}
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                {fr.playbooks.form.cancel}
              </Button>
              <Button type="button" disabled={!canSubmit} onClick={handleExecute}>
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {fr.playbooks.executeModal.running}
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    {fr.playbooks.executeModal.confirm}
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
