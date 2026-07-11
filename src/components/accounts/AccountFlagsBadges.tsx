import { X } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/useT';
import type { AccountFlag } from '@/types/database';

const FLAG_STYLES: Record<string, { bg: string; text: string }> = {
  review_needed: { bg: 'bg-amber-100', text: 'text-amber-800' },
  escalation: { bg: 'bg-red-100', text: 'text-red-800' },
  vip: { bg: 'bg-violet-100', text: 'text-violet-800' },
  at_risk: { bg: 'bg-orange-100', text: 'text-orange-800' },
};

const FLAG_LABELS: Record<string, string> = {
  review_needed: 'Review needed',
  escalation: 'Escalation',
  vip: 'VIP',
  at_risk: 'At risk',
};

function flagStyle(flag: string) {
  return FLAG_STYLES[flag] ?? { bg: 'bg-gray-100', text: 'text-gray-700' };
}

interface Props {
  flags: AccountFlag[];
  onRemove?: (flagName: string) => void;
  isRemoving?: boolean;
  compact?: boolean;
}

export default function AccountFlagsBadges({ flags, onRemove, isRemoving, compact }: Props) {
  const fr = useT();
  if (!flags || flags.length === 0) return null;

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-1.5">
        {flags.map((f) => {
          const style = flagStyle(f.flag);
          const label = FLAG_LABELS[f.flag] ?? f.flag;

          return (
            <Tooltip key={`${f.flag}-${f.set_at}`}>
              <TooltipTrigger asChild>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
                >
                  {compact ? label.slice(0, 1).toUpperCase() : label}
                  {onRemove && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-3.5 w-3.5 p-0 hover:bg-transparent"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(f.flag);
                      }}
                      disabled={isRemoving}
                      aria-label={`${fr.common.delete} ${label}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="font-medium">{label}</p>
                <p className="text-xs">{f.reason}</p>
                <p className="text-xs text-muted-foreground">
                  {fr.format.dateTime(f.set_at)}
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
