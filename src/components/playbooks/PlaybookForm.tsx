import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useT } from '@/lib/i18n/useT';
import ActionEditor from './ActionEditor';
import ConditionEditor from './ConditionEditor';
import StepEditor from '@/components/workflows/StepEditor';
import type {
  Playbook,
  PlaybookAction,
  WorkflowStep,
  PlaybookType,
  PlaybookPriority,
  TemplateCategory,
  ExecutionFrequency,
  ConditionGroup,
  CreatePlaybookPayload,
  UpdatePlaybookPayload,
} from '@/lib/types/playbook';

const PLAYBOOK_TYPES: PlaybookType[] = ['manual', 'automated', 'semi_automated', 'template'];
const PRIORITIES: PlaybookPriority[] = ['low', 'medium', 'high', 'critical'];
const CATEGORIES: TemplateCategory[] = [
  'churn_prevention', 'expansion', 'onboarding', 'reactivation', 'renewal', 'winback',
  'payment_recovery', 'health_monitoring', 'customer_education', 'nps_detractors',
  'champions_advocacy', 'downgrade_prevention', 'success_planning',
];
const FREQUENCIES: ExecutionFrequency[] = ['daily', 'weekly', 'monthly'];
const SEGMENTS = [
  'champions', 'en_expansion', 'stables', 'a_risque_leger',
  'en_danger_critique', 'impayes', 'en_churn', 'nouveaux',
] as const;

interface Props {
  mode: 'create' | 'edit';
  initialData?: Playbook;
  isWorkflow?: boolean;
  onSubmit: (payload: CreatePlaybookPayload | UpdatePlaybookPayload) => void;
  isSubmitting: boolean;
}

export default function PlaybookForm({ mode, initialData, isWorkflow: isWorkflowProp, onSubmit, isSubmitting }: Props) {
  const fr = useT();
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [titleEn, setTitleEn] = useState(initialData?.title_en ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [descriptionEn, setDescriptionEn] = useState(initialData?.description_en ?? '');
  const [playbookType, setPlaybookType] = useState<PlaybookType>(initialData?.playbook_type ?? 'manual');
  const [priority, setPriority] = useState<PlaybookPriority>(initialData?.priority ?? 'medium');
  const [templateCategory, setTemplateCategory] = useState<TemplateCategory | ''>(initialData?.template_category ?? '');
  const [segmentId, setSegmentId] = useState(initialData?.segment_id ?? '__none__');
  const [isAutomated, setIsAutomated] = useState(initialData?.is_automated ?? false);
  const [executionFrequency, setExecutionFrequency] = useState<ExecutionFrequency | ''>(initialData?.execution_frequency ?? '');
  const [requiresApproval, setRequiresApproval] = useState(initialData?.requires_approval ?? false);
  const [actions, setActions] = useState<PlaybookAction[]>(initialData?.actions ?? []);
  const [steps, setSteps] = useState<WorkflowStep[]>(initialData?.steps ?? []);
  const [eligibilityCriteria, setEligibilityCriteria] = useState<ConditionGroup>(
    initialData?.eligibility_criteria ?? { operator: 'AND', conditions: [] },
  );

  const isWorkflow = isWorkflowProp ?? initialData?.is_workflow ?? false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: CreatePlaybookPayload | UpdatePlaybookPayload = {
      title,
      title_en: titleEn || undefined,
      description: description || undefined,
      description_en: descriptionEn || undefined,
      playbook_type: playbookType,
      priority,
      template_category: templateCategory || undefined,
      segment_id: segmentId && segmentId !== '__none__' ? segmentId : undefined,
      is_automated: isAutomated,
      is_workflow: isWorkflow,
      execution_frequency: executionFrequency || undefined,
      requires_approval: requiresApproval,
      actions: !isWorkflow && actions.length > 0 ? actions : undefined,
      steps: isWorkflow && steps.length > 0 ? steps : undefined,
      eligibility_criteria: eligibilityCriteria.conditions.length > 0 ? eligibilityCriteria : undefined,
    };

    onSubmit(payload);
  };

  const createLabel = isWorkflow ? fr.workflows.createWorkflow : fr.playbooks.createPlaybook;
  const creatingLabel = isWorkflow ? fr.workflows.creatingWorkflow : fr.playbooks.creating;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informations de base */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{fr.playbooks.details}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">{fr.playbooks.form.title}</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={fr.playbooks.form.titlePlaceholder}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">{fr.playbooks.form.description}</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={fr.playbooks.form.descriptionPlaceholder}
              rows={3}
            />
          </div>

          {mode === 'edit' && (
            <div className="border-t pt-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {fr.playbooks.form.translationSection}
              </p>
              <div>
                <label className="text-sm font-medium">{fr.playbooks.form.titleEn}</label>
                <Input
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder={fr.playbooks.form.titleEnPlaceholder}
                />
              </div>
              <div>
                <label className="text-sm font-medium">{fr.playbooks.form.descriptionEn}</label>
                <Textarea
                  value={descriptionEn}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                  placeholder={fr.playbooks.form.descriptionEnPlaceholder}
                  rows={3}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">{fr.playbooks.form.type}</label>
              <Select value={playbookType} onValueChange={(v) => setPlaybookType(v as PlaybookType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLAYBOOK_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{fr.playbooks.type[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">{fr.playbooks.form.priority}</label>
              <Select value={priority} onValueChange={(v) => setPriority(v as PlaybookPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>{fr.playbooks.priority[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">{fr.playbooks.form.category}</label>
              <Select value={templateCategory} onValueChange={(v) => setTemplateCategory(v as TemplateCategory)}>
                <SelectTrigger>
                  <SelectValue placeholder={fr.playbooks.allCategories} />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{fr.playbooks.category[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">{fr.playbooks.form.segment}</label>
            <Select value={segmentId} onValueChange={setSegmentId}>
              <SelectTrigger>
                <SelectValue placeholder={fr.playbooks.form.noSegment} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{fr.playbooks.form.noSegment}</SelectItem>
                {SEGMENTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {fr.playbooks.segments[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Actions or Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isWorkflow ? fr.workflows.steps : fr.playbooks.actions}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isWorkflow ? (
            <StepEditor steps={steps} onChange={setSteps} />
          ) : (
            <ActionEditor actions={actions} onChange={setActions} />
          )}
        </CardContent>
      </Card>

      {/* Conditions d'éligibilité */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{fr.playbooks.conditions}</CardTitle>
        </CardHeader>
        <CardContent>
          <ConditionEditor conditionGroup={eligibilityCriteria} onChange={setEligibilityCriteria} />
        </CardContent>
      </Card>

      {/* Automatisation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{fr.playbooks.automation}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{fr.playbooks.form.automated}</label>
            <Switch checked={isAutomated} onCheckedChange={setIsAutomated} />
          </div>
          {isAutomated && (
            <div>
              <label className="text-sm font-medium">{fr.playbooks.form.frequency}</label>
              <Select
                value={executionFrequency}
                onValueChange={(v) => setExecutionFrequency(v as ExecutionFrequency)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((f) => (
                    <SelectItem key={f} value={f}>
                      {fr.playbooks.form[`frequency${f.charAt(0).toUpperCase() + f.slice(1)}` as keyof typeof fr.playbooks.form]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{fr.playbooks.form.requiresApproval}</label>
            <Switch checked={requiresApproval} onCheckedChange={setRequiresApproval} />
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isSubmitting || !title.trim()}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {mode === 'create' ? creatingLabel : fr.playbooks.form.saving}
            </>
          ) : (
            mode === 'create' ? createLabel : fr.playbooks.form.save
          )}
        </Button>
      </div>
    </form>
  );
}
