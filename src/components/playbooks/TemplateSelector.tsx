import {
  Shield,
  RefreshCw,
  TrendingUp,
  Rocket,
  Calendar,
  Heart,
  Plus,
  Star,
  Puzzle,
  ShieldCheck,
  GraduationCap,
  Users,
  DollarSign,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { fr } from '@/i18n/fr';
import PriorityBadge from './PriorityBadge';
import type { Playbook, TemplateCategory } from '@/lib/types/playbook';

const categoryConfig: Record<string, { icon: React.ElementType; color: string }> = {
  churn_prevention: { icon: Shield, color: 'text-rose-500 bg-rose-50' },
  reactivation: { icon: RefreshCw, color: 'text-orange-500 bg-orange-50' },
  expansion: { icon: TrendingUp, color: 'text-emerald-500 bg-emerald-50' },
  onboarding: { icon: Rocket, color: 'text-blue-500 bg-blue-50' },
  renewal: { icon: Calendar, color: 'text-indigo-500 bg-indigo-50' },
  health_recovery: { icon: Heart, color: 'text-purple-500 bg-purple-50' },
  winback: { icon: Heart, color: 'text-violet-500 bg-violet-50' },
  customer_satisfaction: { icon: Star, color: 'text-amber-500 bg-amber-50' },
  feature_adoption: { icon: Puzzle, color: 'text-cyan-500 bg-cyan-50' },
  compliance: { icon: ShieldCheck, color: 'text-slate-500 bg-slate-50' },
  training: { icon: GraduationCap, color: 'text-teal-500 bg-teal-50' },
  engagement: { icon: Users, color: 'text-pink-500 bg-pink-50' },
  revenue_optimization: { icon: DollarSign, color: 'text-lime-600 bg-lime-50' },
};

interface Props {
  templates: Playbook[];
  isLoading: boolean;
  onSelectTemplate: (template: Playbook) => void;
  onCreateFromScratch: () => void;
}

export default function TemplateSelector({
  templates,
  isLoading,
  onSelectTemplate,
  onCreateFromScratch,
}: Props) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">{fr.playbooks.templateSelector.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{fr.playbooks.templateSelector.subtitle}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-52 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{fr.playbooks.templateSelector.title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{fr.playbooks.templateSelector.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Carte "Créer de zéro" */}
        <Card
          className="border-dashed border-2 cursor-pointer hover:border-primary hover:shadow-lg transition-all group"
          onClick={onCreateFromScratch}
        >
          <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <p className="font-semibold">{fr.playbooks.templateSelector.createFromScratch}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {fr.playbooks.templateSelector.createFromScratchDesc}
            </p>
          </CardContent>
        </Card>

        {/* Cartes templates */}
        {templates.map((template) => {
          const cat = template.template_category ?? 'churn_prevention';
          const config = categoryConfig[cat] ?? categoryConfig.churn_prevention;
          const Icon = config.icon;
          const catLabel = fr.playbooks.category[cat as TemplateCategory] ?? cat;
          const isWorkflow = template.is_workflow;
          const actionsCount = isWorkflow ? (template.steps?.length ?? 0) : (template.actions?.length ?? 0);
          const conditionsCount = template.eligibility_criteria?.conditions?.length ?? 0;

          return (
            <Card
              key={template.id}
              className="cursor-pointer hover:shadow-lg transition-shadow group"
              onClick={() => onSelectTemplate(template)}
            >
              <CardContent className="p-5 space-y-3">
                {/* Icon + category */}
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${config.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {catLabel}
                  </Badge>
                  {isWorkflow && (
                    <Badge variant="secondary" className="text-xs">
                      {fr.workflows.workflowBadge}
                    </Badge>
                  )}
                </div>

                {/* Title */}
                <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                  {template.title}
                </h3>

                {/* Description */}
                {template.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>
                )}

                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <PriorityBadge priority={template.priority} />
                  <Badge variant="secondary" className="text-xs">
                    {fr.playbooks.type[template.playbook_type] ?? template.playbook_type}
                  </Badge>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 border-t">
                  <span>{actionsCount} {isWorkflow ? fr.workflows.stepCount : fr.playbooks.templateSelector.actionsCount}</span>
                  {conditionsCount > 0 && (
                    <span>{conditionsCount} {fr.playbooks.templateSelector.conditionsCount}</span>
                  )}
                </div>

                {/* CTA */}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full group-hover:bg-primary group-hover:text-white transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTemplate(template);
                  }}
                >
                  {fr.playbooks.templateSelector.useTemplate}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
