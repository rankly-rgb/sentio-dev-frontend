import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fr } from '@/i18n/fr';
import { usePlaybooks } from '@/hooks/usePlaybooks';
import PlaybookCard from '@/components/playbooks/PlaybookCard';
import type { PlaybookStatus, PlaybookType, TemplateCategory, PlaybookFilters } from '@/lib/types/playbook';

const STATUSES: PlaybookStatus[] = ['draft', 'active', 'paused', 'completed', 'archived'];
const TYPES: PlaybookType[] = ['manual', 'automated', 'hybrid'];
const CATEGORIES: TemplateCategory[] = [
  'churn_prevention', 'expansion', 'onboarding', 'renewal', 'reactivation', 'health_recovery',
];

const PER_PAGE = 12;

export default function Playbooks() {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [page, setPage] = useState(1);

  const filters: PlaybookFilters = {
    status: filterStatus as PlaybookStatus | 'all',
    playbook_type: filterType as PlaybookType | 'all',
    template_category: filterCategory as TemplateCategory | 'all',
    page,
    per_page: PER_PAGE,
  };

  const { data, isLoading, error } = usePlaybooks(filters);
  const playbooks = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <BookOpen className="h-7 w-7 text-primary/60" />
          <h1 className="text-2xl font-bold">{fr.playbooks.title}</h1>
        </div>
        <Button onClick={() => navigate('/playbooks/new')}>
          <Plus className="h-4 w-4 mr-2" />
          {fr.playbooks.create}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={fr.playbooks.filterStatus} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{fr.playbooks.allStatuses}</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{fr.playbooks.status[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterType} onValueChange={(v) => { setFilterType(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={fr.playbooks.filterType} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{fr.playbooks.allTypes}</SelectItem>
            {TYPES.map((t) => (
              <SelectItem key={t} value={t}>{fr.playbooks.type[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={fr.playbooks.filterCategory} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{fr.playbooks.allCategories}</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{fr.playbooks.category[c]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {error ? (
        <Card className="border-destructive">
          <CardContent className="p-6">
            <p className="text-destructive text-sm">{fr.common.error} : {(error as Error).message}</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : playbooks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">{fr.playbooks.noPlaybooks}</p>
            <p className="text-sm text-muted-foreground mt-1">{fr.playbooks.noPlaybooksDesc}</p>
            <Button className="mt-6" onClick={() => navigate('/playbooks/new')}>
              <Plus className="h-4 w-4 mr-2" />
              {fr.playbooks.create}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {playbooks.map((pb) => (
              <PlaybookCard key={pb.id} playbook={pb} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {fr.common.showing} {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} {fr.common.of} {total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  {fr.common.previous}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {fr.common.next}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
