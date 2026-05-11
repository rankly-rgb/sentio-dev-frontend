import { useNavigate } from 'react-router-dom';
import { Sparkles, Users, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/useT';
import { useSuggestedPlaybook } from '@/hooks/useSuggestedPlaybook';
import { Skeleton } from '@/components/ui/skeleton';

function PlaybookIllustration() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <circle cx="40" cy="40" r="36" fill="hsl(var(--primary)/0.08)" />
      <rect x="24" y="28" width="32" height="4" rx="2" fill="hsl(var(--primary)/0.3)" />
      <rect x="24" y="36" width="24" height="4" rx="2" fill="hsl(var(--primary)/0.2)" />
      <rect x="24" y="44" width="28" height="4" rx="2" fill="hsl(var(--primary)/0.15)" />
      <circle cx="56" cy="56" r="12" fill="hsl(var(--primary))" />
      <path d="M51 56l3 3 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function SuggestedPlaybook() {
  const fr = useT();
  const navigate = useNavigate();
  const { data, isLoading, error, ignore } = useSuggestedPlaybook();

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-4 space-y-3 mb-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (error || !data || data.already_active) return null;

  const handleActivate = () => {
    if (data.suggested_playbook_id) {
      navigate(`/playbooks/${data.suggested_playbook_id}`);
    } else {
      navigate(`/playbooks/new?category=${data.template_category}`);
    }
  };

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 mb-4 animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="shrink-0 hidden sm:block">
          <PlaybookIllustration />
        </div>

        <div className="flex-1 min-w-0">
          {/* Label */}
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">
              {fr.suggestedPlaybook.recommendation}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-base mb-1">{data.title}</h3>

          {/* Reason */}
          <p className="text-sm text-muted-foreground mb-3">{data.reason}</p>

          {/* Targeted count */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
            <Users className="h-3.5 w-3.5" />
            <span>{fr.suggestedPlaybook.targetedAccounts(data.accounts_targeted)}</span>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={handleActivate} className="gap-1">
              {fr.suggestedPlaybook.activate}
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground text-xs"
              onClick={() => ignore()}
            >
              {fr.suggestedPlaybook.ignore}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
