import { useState } from 'react';
import { ClipboardList, Pencil, Settings2, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useT } from '@/lib/i18n/useT';
import { useAccountNotes } from '@/hooks/useAccountNotes';
import type { NoteType } from '@/lib/types/account-notes';

const NOTE_ICONS: Record<NoteType, React.ElementType> = {
  playbook_action: ClipboardList,
  manual: Pencil,
  system: Settings2,
};

const NOTE_TYPE_LABELS: Record<NoteType, string> = {
  playbook_action: 'Playbook',
  manual: 'Manuelle',
  system: 'Système',
};

function relativeTime(dateStr: string, formatDate: (d: string) => string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `il y a ${Math.max(1, minutes)} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days}j`;
  return formatDate(dateStr);
}

interface Props {
  accountId: string;
}

export default function AccountNotesSection({ accountId }: Props) {
  const fr = useT();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAccountNotes(accountId, page);

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>{fr.accountDetail.notes}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const notes = data?.data ?? [];
  const hasMore = data?.hasMore ?? false;

  if (notes.length === 0 && page === 1) {
    return (
      <Card>
        <CardHeader><CardTitle>{fr.accountDetail.notes}</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            {fr.accountDetail.noNotes}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{fr.accountDetail.notes}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {notes.map((note) => {
            const Icon = NOTE_ICONS[note.note_type as NoteType] ?? ClipboardList;

            return (
              <div key={note.id} className="flex gap-3 p-3 border rounded-lg">
                <Icon className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{note.title}</p>
                    {note.source === 'playbook' && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {NOTE_TYPE_LABELS.playbook_action}
                      </Badge>
                    )}
                  </div>
                  {note.body && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {note.body}
                    </p>
                  )}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-[10px] text-muted-foreground mt-1 cursor-help w-fit">
                          {relativeTime(note.created_at, fr.format.date)}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{fr.format.dateTime(note.created_at)}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            );
          })}
        </div>

        {(hasMore || page > 1) && (
          <div className="flex justify-center gap-2 mt-4">
            {page > 1 && (
              <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)}>
                {fr.common.previous}
              </Button>
            )}
            {hasMore && (
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)}>
                <ChevronDown className="h-3.5 w-3.5 mr-1" />
                {fr.accountDetail.moreNotes}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
