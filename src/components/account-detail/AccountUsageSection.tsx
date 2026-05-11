import { useT } from '@/lib/i18n/useT';
import { BarChart3 } from 'lucide-react';
import type { UsageItem } from '@/lib/types/accounts';

interface Props {
  usageEvents: UsageItem[];
  trackerConnected: boolean;
}

function aggregateByDate(events: UsageItem[]): { date: string; count: number }[] {
  const map = new Map<string, number>();
  for (const e of events) {
    map.set(e.event_date, (map.get(e.event_date) ?? 0) + e.event_count);
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date: date.slice(5), count }));
}

function aggregateByType(events: UsageItem[]): { type: string; count: number }[] {
  const map = new Map<string, number>();
  for (const e of events) {
    map.set(e.event_type, (map.get(e.event_type) ?? 0) + e.event_count);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ type, count }));
}

export default function AccountUsageSection({ usageEvents, trackerConnected }: Props) {
  const fr = useT();
  if (!trackerConnected) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-center">
        <BarChart3 className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">
          {fr.integrations.tracker.breakdownPlaceholder}
        </p>
      </div>
    );
  }

  if (usageEvents.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-4">
        {fr.accountDetail.noData}
      </p>
    );
  }

  const dailyData = aggregateByDate(usageEvents);
  const byType = aggregateByType(usageEvents);
  const maxCount = Math.max(...dailyData.map((d) => d.count), 1);

  return (
    <div className="space-y-4">
      {/* Mini bar chart */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">
          {fr.accountDetail.usage} (30j)
        </p>
        <div className="flex items-end gap-px h-16">
          {dailyData.map((d) => (
            <div
              key={d.date}
              className="flex-1 bg-primary/70 rounded-t-sm min-w-[3px] hover:bg-primary transition-colors"
              style={{ height: `${(d.count / maxCount) * 100}%` }}
              title={`${d.date}: ${d.count}`}
            />
          ))}
        </div>
      </div>

      {/* By type */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">Par type</p>
        {byType.slice(0, 5).map((t) => (
          <div key={t.type} className="flex items-center justify-between text-xs">
            <span className="truncate">{t.type}</span>
            <span className="font-medium ml-2">{t.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
