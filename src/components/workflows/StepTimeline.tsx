import { useT } from '@/lib/i18n/useT';
import StepDelayBadge from './StepDelayBadge';
import type { WorkflowStep } from '@/lib/types/playbook';

interface Props {
  steps: WorkflowStep[];
}

export default function StepTimeline({ steps }: Props) {
  const fr = useT();
  if (!steps || steps.length === 0) {
    return <p className="text-sm text-muted-foreground">{fr.workflows.noSteps}</p>;
  }

  const sorted = [...steps].sort((a, b) => a.step_order - b.step_order);

  return (
    <div className="relative space-y-0">
      {sorted.map((step, idx) => {
        const isLast = idx === sorted.length - 1;
        const actionLabel =
          fr.playbooks.actionType[step.action_type] ?? step.action_type;

        return (
          <div key={idx} className="flex gap-4">
            {/* Left: connector line + circle */}
            <div className="flex flex-col items-center">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold border-2 border-primary/20">
                {idx + 1}
              </div>
              {!isLast && (
                <div className="w-0.5 flex-1 bg-border min-h-[24px]" />
              )}
            </div>

            {/* Right: content */}
            <div className={`pb-6 ${isLast ? 'pb-0' : ''}`}>
              <div className="flex items-center gap-2 flex-wrap">
                <StepDelayBadge delayDays={step.delay_days} />
                <span className="text-xs text-muted-foreground">{actionLabel}</span>
              </div>
              <p className="text-sm font-medium mt-1">{step.title}</p>
              {step.action_type === 'send_email' && typeof step.config.subject === 'string' && step.config.subject && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-md">
                  {step.config.subject}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
