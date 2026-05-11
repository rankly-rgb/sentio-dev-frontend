import { useState } from 'react';
import { Loader2, Play, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
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
import { useT } from '@/lib/i18n/useT';
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
  lastExecutedAt?: string | null;
  eligibleCount?: number;
}

export default function ExecutePlaybookModal({ open, onOpenChange, playbookId, lastExecutedAt, eligibleCount }: Props) {
  const fr = useT();
  const [mode, setMode] = useState<'eligible' | 'segment' | 'accounts'>('eligible');
  const [segmentId, setSegmentId] = useState('');
  const [accountIdsRaw, setAccountIdsRaw] = useState('');
  const [cooldownHours, setCooldownHours] = useState(24);
  const [result, setResult] = useState<ExecutePlaybookResponse | null>(null);

  const { mutate, isPending } = useExecutePlaybook();

  // Compute cooldown warning from last execution
  const cooldownWarning = (() => {
    if (!lastExecutedAt) return null;
    const cooldownEnd = new Date(new Date(lastExecutedAt).getTime() + cooldownHours * 3600000);
    const now = new Date();
    if (now < cooldownEnd) {
      const hoursLeft = Math.ceil((cooldownEnd.getTime() - now.getTime()) / 3600000);
      return `Cooldown actif — prochain run possible dans ${hoursLeft}h`;
    }
    return null;
  })();

  const handleExecute = () => {
    const base = {
      playbook_id: playbookId,
      execution_source: 'manual' as const,
      cooldown_hours: cooldownHours,
    };

    const payload = mode === 'eligible'
      ? { ...base, target_mode: 'eligible' as const }
      : mode === 'segment'
        ? { ...base, segment_id: segmentId }
        : { ...base, account_ids: accountIdsRaw.split(',').map((id) => id.trim()).filter(Boolean) };

    mutate(payload, {
      onSuccess: (data) => setResult(data),
    });
  };

  const handleClose = () => {
    setResult(null);
    setMode('eligible');
    setSegmentId('');
    setAccountIdsRaw('');
    setCooldownHours(24);
    onOpenChange(false);
  };

  const canSubmit =
    !isPending &&
    (mode === 'eligible'
      ? true
      : mode === 'segment'
        ? !!segmentId
        : accountIdsRaw.trim().length > 0);

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
              {result.status === 'pending_approval' ? (
                <AlertTriangle className="h-8 w-8 text-amber-500" />
              ) : result.executions_created > 0 ? (
                <CheckCircle className="h-8 w-8 text-emerald-500" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              )}
              <div>
                <p className="font-medium">
                  {result.status === 'pending_approval'
                    ? `Exécution en attente d'approbation — ${result.accounts_count ?? 0} comptes`
                    : result.executions_created > 0
                      ? result.has_more
                        ? `${result.executions_created} comptes traités (${result.total_eligible ?? '?'} éligibles au total)`
                        : `${result.executions_created} comptes traités`
                      : 'Aucun compte traité'}
                </p>
                {result.executions_created === 0 && result.status !== 'pending_approval' && (
                  <p className="text-sm text-muted-foreground">
                    {(() => {
                      const MESSAGE_MAP: Record<string, string> = {
                        'All eligible accounts have recent executions':
                          'Tous les comptes éligibles ont déjà été traités dans les dernières 24h. Réessayez plus tard.',
                        'No accounts match eligibility criteria':
                          'Aucun compte ne correspond aux critères d\'éligibilité du playbook.',
                        'No accounts found':
                          'Aucun compte trouvé dans l\'organisation.',
                        'No eligible accounts':
                          'Aucun compte éligible dans le segment cible.',
                      };
                      return MESSAGE_MAP[result.message ?? ''] ?? result.message ?? 'Aucun compte éligible';
                    })()}
                  </p>
                )}
              </div>
            </div>
            {/* Actions summary (webhook, slack, hubspot, email) */}
            {result.actions_summary && result.actions_summary.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Actions :</p>
                <div className="space-y-1.5">
                  {result.actions_summary.map((action, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      {action.status === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      ) : action.status === 'skipped' ? (
                        <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                      )}
                      <div>
                        <span>{action.message}</span>
                        {action.status === 'success' && action.status_code != null && action.latency_ms != null && (
                          <span className="text-muted-foreground ml-1">
                            — {action.status_code} OK ({action.latency_ms}ms)
                          </span>
                        )}
                        {action.type === 'webhook' && action.status === 'success' && (
                          <p className="text-xs text-muted-foreground">
                            stripe_customer_id transmis — votre outil fait le reste
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Per-account results */}
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
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={mode === 'eligible' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('eligible')}
              >
                {fr.playbooks.executeModal.allEligible}
                {eligibleCount != null && ` (${eligibleCount})`}
              </Button>
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

            {mode === 'segment' && (
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
            )}
            {mode === 'accounts' && (
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
              {cooldownWarning && (
                <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  {cooldownWarning}
                </p>
              )}
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
