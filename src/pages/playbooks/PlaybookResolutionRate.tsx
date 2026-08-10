import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LineChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useT } from '@/lib/i18n/useT';
import { usePlaybooks } from '@/hooks/usePlaybooks';
import { usePlaybookResolutionRate } from '@/hooks/usePlaybookResolutionRate';
import type { PlaybookOutcomeStatsGroup } from '@/lib/types/playbook';

function ResolutionRateCard({
  title,
  group,
}: {
  title: string;
  group: PlaybookOutcomeStatsGroup;
}) {
  const fr = useT();
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {group.sample_size_warning ? (
          <p className="text-sm text-muted-foreground">
            {fr.playbooks.attribution.insufficientSample(group.sample_size)}
          </p>
        ) : (
          <p className="text-3xl font-bold">
            {group.resolution_rate === null
              ? '–'
              : fr.format.percentage(group.resolution_rate * 100)}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {fr.playbooks.attribution.sampleSize(group.sample_size)}
          {' · '}
          {fr.playbooks.attribution.resolvedCount(group.resolved_count)}
        </p>
      </CardContent>
    </Card>
  );
}

export default function PlaybookResolutionRate() {
  const fr = useT();
  const navigate = useNavigate();
  const [selectedPlaybookId, setSelectedPlaybookId] = useState<string>('');

  const { data: playbooksData, isLoading: playbooksLoading } = usePlaybooks({ status: 'active' });
  const playbooks = useMemo(() => playbooksData?.data ?? [], [playbooksData]);

  useEffect(() => {
    if (!selectedPlaybookId && playbooks.length > 0) {
      setSelectedPlaybookId(playbooks[0].id);
    }
  }, [playbooks, selectedPlaybookId]);

  const {
    data: stats,
    isLoading: statsLoading,
    error,
  } = usePlaybookResolutionRate(selectedPlaybookId || undefined);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/playbooks')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <LineChart className="h-6 w-6 text-primary/60" />
        <h1 className="text-2xl font-bold">{fr.playbooks.attribution.resolutionRateTitle}</h1>
      </div>

      <div className="max-w-xs">
        {playbooksLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <Select value={selectedPlaybookId} onValueChange={setSelectedPlaybookId}>
            <SelectTrigger>
              <SelectValue placeholder={fr.playbooks.attribution.selectPlaybook} />
            </SelectTrigger>
            <SelectContent>
              {playbooks.map((pb) => (
                <SelectItem key={pb.id} value={pb.id}>
                  {pb.display_name || pb.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {!selectedPlaybookId && !playbooksLoading && (
        <p className="text-sm text-muted-foreground">{fr.playbooks.attribution.noActivePlaybooks}</p>
      )}

      {selectedPlaybookId && (
        statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : error || !stats ? (
          <Card className="border-destructive">
            <CardContent className="p-6">
              <p className="text-destructive text-sm">
                {fr.common.error} : {(error as Error)?.message ?? fr.playbooks.attribution.loadError}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ResolutionRateCard
              title={fr.playbooks.attribution.executedGroup}
              group={stats.executed}
            />
            <ResolutionRateCard
              title={fr.playbooks.attribution.notExecutedGroup}
              group={stats.not_executed}
            />
          </div>
        )
      )}
    </div>
  );
}
