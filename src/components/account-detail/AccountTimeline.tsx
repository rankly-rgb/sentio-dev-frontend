import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useT } from '@/lib/i18n/useT';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PlayCircle, StickyNote, Flag, CheckCircle2, XCircle, Clock, Loader2,
} from 'lucide-react';
import type { AccountFlag } from '@/types/database';
import type { AccountNote } from '@/lib/types/account-notes';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ExecutionRow {
  id: string;
  playbook_id: string;
  execution_status: string;
  execution_source: string | null;
  health_score_before: number | null;
  health_score_after: number | null;
  mrr_recovered_cents: number | null;
  mrr_expansion_cents: number | null;
  executed_at: string;
  playbooks: { title: string } | null;
}

interface TimelineEvent {
  id: string;
  date: string;
  type: 'execution' | 'note' | 'flag';
  execution?: ExecutionRow;
  note?: AccountNote;
  flag?: AccountFlag;
}

// ─── Execution query ─────────────────────────────────────────────────────────

function usePlaybookExecutions(accountId: string) {
  const { user } = useAuth();
  return useQuery<ExecutionRow[]>({
    queryKey: ['account-executions', accountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('playbook_executions')
        .select('id, playbook_id, execution_status, execution_source, health_score_before, health_score_after, mrr_recovered_cents, mrr_expansion_cents, executed_at, playbooks(title)')
        .eq('account_id', accountId)
        .order('executed_at', { ascending: false })
        .limit(15);
      if (error) throw error;
      return (data ?? []).map((row) => ({
        ...row,
        playbooks: Array.isArray(row.playbooks) ? row.playbooks[0] ?? null : row.playbooks,
      })) as ExecutionRow[];
    },
    enabled: !!user?.organization_id,
    staleTime: 60_000,
  });
}

function useAccountNotes(accountId: string) {
  const { user } = useAuth();
  return useQuery<AccountNote[]>({
    queryKey: ['account-timeline-notes', accountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('account_notes')
        .select('id, title, body, note_type, source, playbook_id, execution_id, created_at, updated_at, account_id, organization_id')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as AccountNote[];
    },
    enabled: !!user?.organization_id,
    staleTime: 60_000,
  });
}

// ─── Merge + sort ────────────────────────────────────────────────────────────

function buildTimeline(
  executions: ExecutionRow[],
  notes: AccountNote[],
  flags: AccountFlag[],
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const ex of executions) {
    events.push({ id: `ex-${ex.id}`, date: ex.executed_at, type: 'execution', execution: ex });
  }
  for (const note of notes) {
    events.push({ id: `note-${note.id}`, date: note.created_at, type: 'note', note });
  }
  for (const flag of flags) {
    events.push({ id: `flag-${flag.flag}-${flag.set_at}`, date: flag.set_at, type: 'flag', flag });
  }

  return events.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20);
}

// ─── Status icon ─────────────────────────────────────────────────────────────

function ExecutionStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />;
    case 'partially_completed':
      return <CheckCircle2 className="h-3.5 w-3.5 text-amber-500" />;
    case 'failed':
      return <XCircle className="h-3.5 w-3.5 text-red-600" />;
    case 'pending_approval':
    case 'pending':
      return <Clock className="h-3.5 w-3.5 text-amber-500" />;
    case 'running':
      return <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin" />;
    default:
      return <PlayCircle className="h-3.5 w-3.5 text-muted-foreground" />;
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  accountId: string;
  flags: AccountFlag[];
}

export default function AccountTimeline({ accountId, flags }: Props) {
  const fr = useT();
  const { data: executions, isLoading: exLoading } = usePlaybookExecutions(accountId);
  const { data: notes, isLoading: notesLoading } = useAccountNotes(accountId);

  const isLoading = exLoading || notesLoading;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  const timeline = buildTimeline(executions ?? [], notes ?? [], flags);

  if (timeline.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-4">
        {fr.accountDetail.noData}
      </p>
    );
  }

  return (
    <div className="relative space-y-0">
      {/* Vertical line */}
      <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />

      {timeline.map((event) => (
        <div key={event.id} className="relative flex gap-3 py-2 pl-1">
          {/* Dot */}
          <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background border">
            {event.type === 'execution' && <PlayCircle className="h-3.5 w-3.5 text-primary" />}
            {event.type === 'note' && <StickyNote className="h-3.5 w-3.5 text-blue-500" />}
            {event.type === 'flag' && <Flag className="h-3.5 w-3.5 text-amber-500" />}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>{fr.format.dateTime(event.date)}</span>
            </div>

            {event.type === 'execution' && event.execution && (
              <div className="mt-0.5">
                <div className="flex items-center gap-1.5">
                  <ExecutionStatusIcon status={event.execution.execution_status} />
                  <span className="text-sm font-medium truncate">
                    {event.execution.playbooks?.title ?? 'Playbook'}
                  </span>
                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                    {fr.playbooks.executionStatusLabels[event.execution.execution_status] ?? event.execution.execution_status}
                  </Badge>
                </div>
                {/* Score delta */}
                {event.execution.health_score_before !== null &&
                  event.execution.health_score_after !== null && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Health: {event.execution.health_score_before} → {event.execution.health_score_after}
                      {' '}
                      ({event.execution.health_score_after - event.execution.health_score_before > 0 ? '+' : ''}
                      {event.execution.health_score_after - event.execution.health_score_before})
                    </p>
                  )}
                {/* MRR impact */}
                {(event.execution.mrr_recovered_cents ?? 0) > 0 && (
                  <p className="text-[11px] text-green-600">
                    MRR recovered: {fr.format.currency(event.execution.mrr_recovered_cents ?? 0)}
                  </p>
                )}
                {(event.execution.mrr_expansion_cents ?? 0) > 0 && (
                  <p className="text-[11px] text-blue-600">
                    MRR expansion: {fr.format.currency(event.execution.mrr_expansion_cents ?? 0)}
                  </p>
                )}
              </div>
            )}

            {event.type === 'note' && event.note && (
              <div className="mt-0.5">
                <p className="text-sm font-medium">{event.note.title ?? 'Note'}</p>
                {event.note.body && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{event.note.body}</p>
                )}
                {event.note.source && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0 mt-0.5">
                    {event.note.source}
                  </Badge>
                )}
              </div>
            )}

            {event.type === 'flag' && event.flag && (
              <div className="mt-0.5">
                <p className="text-sm font-medium">
                  Flag : {event.flag.flag}
                </p>
                {event.flag.reason && (
                  <p className="text-xs text-muted-foreground">{event.flag.reason}</p>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
