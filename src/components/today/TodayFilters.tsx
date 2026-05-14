import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useT } from '@/lib/i18n/useT';
import { useSegmentLabels } from '@/lib/i18n/useSegmentLabels';
import { PRIORITY_CODES } from '@/lib/priority-labels';
import type { PriorityCode } from '@/lib/priority-labels';
import { SEGMENT_KEYS } from '@/lib/types/segments';
import { categoryLabel } from '@/lib/types/today-actions';
import type { TodayActionsFilters } from '@/lib/types/today-actions';
import type { TemplateCategory } from '@/lib/types/playbook';

interface TodayFiltersProps {
  filters: TodayActionsFilters;
  onFiltersChange: (filters: TodayActionsFilters) => void;
  availableCategories: TemplateCategory[];
}

export default function TodayFilters({ filters, onFiltersChange, availableCategories }: TodayFiltersProps) {
  const fr = useT();
  const segmentLabels = useSegmentLabels();
  const hasActiveFilters = !!(filters.priority || filters.segment || filters.category || (filters.mrrMin && filters.mrrMin > 0));

  const updateFilter = <K extends keyof TodayActionsFilters>(key: K, value: TodayActionsFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    onFiltersChange({});
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-card border border-border/50 p-3">
      <Filter className="h-4 w-4 text-muted-foreground shrink-0" />

      {/* Priorité */}
      <Select
        value={filters.priority ?? '__all__'}
        onValueChange={(v) => updateFilter('priority', v === '__all__' ? undefined : v as PriorityCode)}
      >
        <SelectTrigger className="w-[160px] h-9 text-sm">
          <SelectValue placeholder={fr.todayActions.allPriorities} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{fr.todayActions.allPriorities}</SelectItem>
          {PRIORITY_CODES.map((code) => (
            <SelectItem key={code} value={code}>
              {code} — {fr.todayActions[code === 'P0' ? 'critiques' : code === 'P1' ? 'hautes' : 'normales']}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Segment */}
      <Select
        value={filters.segment ?? '__all__'}
        onValueChange={(v) => updateFilter('segment', v === '__all__' ? undefined : v)}
      >
        <SelectTrigger className="w-[180px] h-9 text-sm">
          <SelectValue placeholder={fr.todayActions.allSegments} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{fr.todayActions.allSegments}</SelectItem>
          {SEGMENT_KEYS.map((key) => (
            <SelectItem key={key} value={key}>{segmentLabels[key]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Catégorie */}
      <Select
        value={filters.category ?? '__all__'}
        onValueChange={(v) => updateFilter('category', v === '__all__' ? undefined : v)}
      >
        <SelectTrigger className="w-[180px] h-9 text-sm">
          <SelectValue placeholder={fr.todayActions.allCategories} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{fr.todayActions.allCategories}</SelectItem>
          {availableCategories.map((cat) => (
            <SelectItem key={cat} value={cat}>{categoryLabel(cat)}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* MRR minimum */}
      <Input
        type="number"
        min={0}
        placeholder={fr.todayActions.mrrMinPlaceholder}
        className="w-[130px] h-9 text-sm"
        value={filters.mrrMin ?? ''}
        onChange={(e) => {
          const val = e.target.value ? Number(e.target.value) : undefined;
          updateFilter('mrrMin', val);
        }}
      />

      {/* Reset */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9 gap-1.5 text-muted-foreground">
          <X className="h-3.5 w-3.5" />
          {fr.todayActions.resetFilters}
        </Button>
      )}
    </div>
  );
}
