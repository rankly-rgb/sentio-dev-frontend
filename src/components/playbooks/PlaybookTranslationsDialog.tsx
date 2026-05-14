import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/useT';
import { usePlaybooks } from '@/hooks/usePlaybooks';
import { useUpdatePlaybook } from '@/hooks/usePlaybooks';
import type { Playbook } from '@/lib/types/playbook';

interface RowState {
  titleEn: string;
  descriptionEn: string;
  saving: boolean;
  saved: boolean;
}

interface TranslationRowProps {
  playbook: Playbook;
  state: RowState;
  onChange: (field: 'titleEn' | 'descriptionEn', value: string) => void;
  onSave: () => void;
}

function TranslationRow({ playbook, state, onChange, onSave }: TranslationRowProps) {
  const fr = useT();

  return (
    <div className="grid grid-cols-[1fr_1fr_1.5fr_auto] gap-3 items-start py-3 border-b last:border-b-0">
      <div className="text-sm font-medium text-muted-foreground truncate pt-2" title={playbook.title}>
        {playbook.title}
      </div>
      <Input
        value={state.titleEn}
        onChange={(e) => onChange('titleEn', e.target.value)}
        placeholder={fr.playbooks.form.titleEnPlaceholder}
        className="text-sm h-9"
      />
      <Textarea
        value={state.descriptionEn}
        onChange={(e) => onChange('descriptionEn', e.target.value)}
        placeholder={fr.playbooks.form.descriptionEnPlaceholder}
        rows={2}
        className="text-sm resize-none"
      />
      <Button
        size="sm"
        variant={state.saved ? 'outline' : 'default'}
        onClick={onSave}
        disabled={state.saving || !state.titleEn.trim()}
        className="mt-0.5 min-w-[80px]"
      >
        {state.saving ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : state.saved ? (
          <><Check className="h-3.5 w-3.5 mr-1" />{fr.playbooks.translationsDialog.saved}</>
        ) : (
          fr.common.save
        )}
      </Button>
    </div>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function PlaybookTranslationsDialog({ open, onClose }: Props) {
  const fr = useT();
  const { data } = usePlaybooks({ is_workflow: false, per_page: 100 });
  const updateMutation = useUpdatePlaybook();
  const playbooks = data?.data ?? [];

  const [rows, setRows] = useState<Record<string, RowState>>({});

  const getRow = (pb: Playbook): RowState =>
    rows[pb.id] ?? {
      titleEn: pb.title_en ?? '',
      descriptionEn: pb.description_en ?? '',
      saving: false,
      saved: false,
    };

  const setRow = (id: string, patch: Partial<RowState>) =>
    setRows((prev) => ({ ...prev, [id]: { ...getRow({ id } as Playbook), ...patch } }));

  const handleChange = (pb: Playbook, field: 'titleEn' | 'descriptionEn', value: string) => {
    setRow(pb.id, { [field]: value, saved: false });
  };

  const handleSave = (pb: Playbook) => {
    const row = getRow(pb);
    if (!row.titleEn.trim()) return;
    setRow(pb.id, { saving: true });
    updateMutation.mutate(
      {
        id: pb.id,
        payload: {
          title_en: row.titleEn.trim(),
          description_en: row.descriptionEn.trim() || undefined,
        },
      },
      {
        onSuccess: () => setRow(pb.id, { saving: false, saved: true }),
        onError: () => setRow(pb.id, { saving: false }),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{fr.playbooks.translationsDialog.title}</DialogTitle>
          <DialogDescription>{fr.playbooks.translationsDialog.subtitle}</DialogDescription>
        </DialogHeader>

        {/* Column headers */}
        <div className="grid grid-cols-[1fr_1fr_1.5fr_auto] gap-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b pb-2">
          <span>{fr.playbooks.translationsDialog.frTitle}</span>
          <span>{fr.playbooks.translationsDialog.enTitle}</span>
          <span>{fr.playbooks.translationsDialog.enDescription}</span>
          <span className="min-w-[80px]" />
        </div>

        {/* Rows */}
        <div className="overflow-y-auto flex-1 pr-1">
          {playbooks.map((pb) => (
            <TranslationRow
              key={pb.id}
              playbook={pb}
              state={getRow(pb)}
              onChange={(field, value) => handleChange(pb, field, value)}
              onSave={() => handleSave(pb)}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
