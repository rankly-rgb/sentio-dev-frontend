import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { fr } from '@/i18n/fr';
import { useAccountSummary } from '@/hooks/useAccountSummary';

interface Props {
  accountId: string;
}

export default function AccountAiSummary({ accountId }: Props) {
  const { data, isPending, isFetching } = useAccountSummary(accountId);
  const [showBadge, setShowBadge] = useState(false);

  useEffect(() => {
    if (data && !data.cached) {
      setShowBadge(true);
      const timer = setTimeout(() => setShowBadge(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [data]);

  if (isPending || (isFetching && !data)) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {fr.aiSummary.title}
          </span>
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-5/6" />
          <Skeleton className="h-3.5 w-4/6" />
        </div>
      </div>
    );
  }

  if (!data?.summary) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {fr.aiSummary.title}
        </span>
        {showBadge && (
          <Badge variant="secondary" className="text-xs py-0 px-1.5 h-4">
            {fr.aiSummary.generatedNow}
          </Badge>
        )}
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{data.summary}</p>
    </div>
  );
}
