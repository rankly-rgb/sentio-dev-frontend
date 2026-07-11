import { useState } from 'react';
import { Shield, RefreshCw, TrendingUp, Calendar, DollarSign, ChevronLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useT } from '@/lib/i18n/useT';
import { usePlaybookTemplatesV1, useCreatePlaybookFromTemplate } from '@/hooks/usePlaybooks';
import PriorityBadge from './PriorityBadge';
import PlaybookActionBadge from './PlaybookActionBadge';
import { isPlaybookActionType } from '@/lib/types/playbook';
import type { PlaybookTemplate, PlaybookTemplateCategory, PlaybookActionType } from '@/lib/types/playbook';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (id: string) => void;
}

const CATEGORY_CONFIG: Record<PlaybookTemplateCategory, { icon: React.ElementType; className: string }> = {
  churn_prevention: { icon: Shield, className: 'text-rose-600 bg-rose-50 border-rose-200' },
  expansion: { icon: TrendingUp, className: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  renewal: { icon: Calendar, className: 'text-blue-600 bg-blue-50 border-blue-200' },
  payment_recovery: { icon: DollarSign, className: 'text-orange-600 bg-orange-50 border-orange-200' },
  reactivation: { icon: RefreshCw, className: 'text-violet-600 bg-violet-50 border-violet-200' },
};

const CATEGORY_LABELS: Record<PlaybookTemplateCategory, string> = {
  churn_prevention: 'Churn prevention',
  expansion: 'Expansion',
  renewal: 'Renewal',
  payment_recovery: 'Payment recovery',
  reactivation: 'Reactivation',
};

function getCategoryConfig(cat: string) {
  return CATEGORY_CONFIG[cat as PlaybookTemplateCategory] ?? CATEGORY_CONFIG.churn_prevention;
}

function getCategoryLabel(cat: string) {
  return CATEGORY_LABELS[cat as PlaybookTemplateCategory] ?? cat;
}

export default function NewPlaybookModal({ open, onOpenChange, onCreated }: Props) {
  const fr = useT();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedTemplate, setSelectedTemplate] = useState<PlaybookTemplate | null>(null);
  const [title, setTitle] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const { data: templates = [], isLoading } = usePlaybookTemplatesV1('en');
  const { mutateAsync: createFromTemplate, isPending: isCreating } = useCreatePlaybookFromTemplate();

  const handleSelectTemplate = (template: PlaybookTemplate) => {
    setSelectedTemplate(template);
    setTitle(template.title);
    setCreateError(null);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setCreateError(null);
  };

  const handleCreate = async () => {
    if (!selectedTemplate) return;
    setCreateError(null);
    try {
      const result = await createFromTemplate({
        templateId: selectedTemplate.id,
        title: title.trim() || selectedTemplate.title,
      });
      onOpenChange(false);
      onCreated?.(result.id);
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Error creating playbook');
    }
  };

  const handleDialogChange = (isOpen: boolean) => {
    if (!isOpen) {
      setStep(1);
      setSelectedTemplate(null);
      setTitle('');
      setCreateError(null);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {step === 2 && (
              <Button variant="ghost" size="icon" onClick={handleBack} className="h-7 w-7 shrink-0">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle>
              {step === 1 ? fr.playbooks.newModal.step1Title : fr.playbooks.newModal.step2Title}
            </DialogTitle>
          </div>
        </DialogHeader>

        {step === 1 && (
          <Step1
            templates={templates}
            isLoading={isLoading}
            onSelect={handleSelectTemplate}
          />
        )}

        {step === 2 && selectedTemplate && (
          <Step2
            template={selectedTemplate}
            title={title}
            onTitleChange={setTitle}
            onCreate={handleCreate}
            isCreating={isCreating}
            error={createError}
            fr={fr}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function Step1({
  templates,
  isLoading,
  onSelect,
}: {
  templates: PlaybookTemplate[];
  isLoading: boolean;
  onSelect: (t: PlaybookTemplate) => void;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
      {templates.map((template) => (
        <TemplateCard key={template.id} template={template} onSelect={onSelect} />
      ))}
    </div>
  );
}

function TemplateCard({
  template,
  onSelect,
}: {
  template: PlaybookTemplate;
  onSelect: (t: PlaybookTemplate) => void;
}) {
  const catConfig = getCategoryConfig(template.template_category);
  const Icon = catConfig.icon;
  const v1Actions = template.actions.filter(a => isPlaybookActionType(a.type));

  return (
    <button
      type="button"
      className="text-left rounded-xl border p-4 space-y-2.5 hover:shadow-md hover:border-primary/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onClick={() => onSelect(template)}
    >
      {/* Category + auto badge */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${catConfig.className}`}>
          <Icon className="h-3 w-3 shrink-0" />
          {getCategoryLabel(template.template_category)}
        </span>
        <PriorityBadge priority={template.priority} />
        <Badge variant="secondary" className="text-xs">
          {template.is_automated ? 'Automatique' : 'Manuel'}
        </Badge>
      </div>

      {/* Title */}
      <p className="font-semibold text-sm leading-tight line-clamp-1">{template.title}</p>

      {/* Description */}
      <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>

      {/* Action badges */}
      {v1Actions.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          {v1Actions.slice(0, 2).map((a, i) => (
            <PlaybookActionBadge key={i} actionType={a.type as PlaybookActionType} />
          ))}
          {v1Actions.length > 2 && (
            <span className="text-xs text-muted-foreground">+{v1Actions.length - 2}</span>
          )}
        </div>
      )}
    </button>
  );
}

function Step2({
  template,
  title,
  onTitleChange,
  onCreate,
  isCreating,
  error,
  fr,
}: {
  template: PlaybookTemplate;
  title: string;
  onTitleChange: (v: string) => void;
  onCreate: () => void;
  isCreating: boolean;
  error: string | null;
  fr: ReturnType<typeof useT>;
}) {
  const catLabel = getCategoryLabel(template.template_category);
  const v1Actions = template.actions.filter(a => isPlaybookActionType(a.type));

  return (
    <div className="space-y-5 mt-2">
      {/* Title field */}
      <div className="space-y-1.5">
        <Label htmlFor="playbook-title">{fr.playbooks.newModal.nameLabel}</Label>
        <Input
          id="playbook-title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={fr.playbooks.newModal.namePlaceholder}
        />
      </div>

      {/* Template summary */}
      <div className="rounded-lg border p-4 space-y-2 bg-muted/30">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {fr.playbooks.newModal.templateSummary}
        </p>
        <p className="font-semibold text-sm">{template.title}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">{catLabel}</span>
          <PriorityBadge priority={template.priority} />
          {v1Actions.map((a, i) => (
            <PlaybookActionBadge key={i} actionType={a.type as PlaybookActionType} />
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* CTA */}
      <Button
        className="w-full"
        onClick={onCreate}
        disabled={isCreating || !title.trim()}
      >
        {isCreating ? fr.playbooks.newModal.creating : fr.playbooks.newModal.createBtn}
      </Button>
    </div>
  );
}
