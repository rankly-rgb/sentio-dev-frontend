import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useT } from '@/lib/i18n/useT';
import { useLanguage } from '@/lib/i18n/useLanguage';
import { usePlaybooks, useWorkflows } from '@/hooks/usePlaybooks';
import PlaybookCard from '@/components/playbooks/PlaybookCard';
import WorkflowCard from '@/components/workflows/WorkflowCard';
import SuggestedPlaybook from '@/components/playbooks/SuggestedPlaybook';
import { PlaybookTranslationsDialog } from '@/components/playbooks/PlaybookTranslationsDialog';
import type { Playbook, PlaybookStatus, PlaybookType, TemplateCategory, PlaybookFilters } from '@/lib/types/playbook';

const STATUSES: PlaybookStatus[] = ['draft', 'active', 'paused', 'completed', 'archived'];
const TYPES: PlaybookType[] = ['manual', 'automated', 'semi_automated', 'template'];
const CATEGORIES: TemplateCategory[] = [
  'churn_prevention', 'expansion', 'onboarding', 'reactivation', 'renewal', 'winback',
  'payment_recovery', 'health_monitoring', 'customer_education', 'nps_detractors',
  'champions_advocacy', 'downgrade_prevention', 'success_planning',
];

const PER_PAGE = 12;

export default function Playbooks() {
  const fr = useT();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'playbooks' | 'workflows'>('playbooks');
  const [translationsOpen, setTranslationsOpen] = useState(false);

  // Playbooks filters
  const [pbFilterStatus, setPbFilterStatus] = useState<string>('all');
  const [pbFilterType, setPbFilterType] = useState<string>('all');
  const [pbFilterCategory, setPbFilterCategory] = useState<string>('all');
  const [pbPage, setPbPage] = useState(1);

  // Workflows filters
  const [wfFilterStatus, setWfFilterStatus] = useState<string>('all');
  const [wfFilterType, setWfFilterType] = useState<string>('all');
  const [wfFilterCategory, setWfFilterCategory] = useState<string>('all');
  const [wfPage, setWfPage] = useState(1);

  const pbFilters: PlaybookFilters = {
    status: pbFilterStatus as PlaybookStatus | 'all',
    playbook_type: pbFilterType as PlaybookType | 'all',
    template_category: pbFilterCategory as TemplateCategory | 'all',
    is_workflow: false,
    page: pbPage,
    per_page: PER_PAGE,
  };

  const wfFilters: PlaybookFilters = {
    status: wfFilterStatus as PlaybookStatus | 'all',
    playbook_type: wfFilterType as PlaybookType | 'all',
    template_category: wfFilterCategory as TemplateCategory | 'all',
    page: wfPage,
    per_page: PER_PAGE,
  };

  const pbQuery = usePlaybooks(pbFilters);
  const wfQuery = useWorkflows(wfFilters);

  const pbPlaybooks = pbQuery.data?.data ?? [];
  const pbTotal = pbQuery.data?.total ?? 0;
  const pbTotalPages = Math.ceil(pbTotal / PER_PAGE);

  const wfPlaybooks = wfQuery.data?.data ?? [];
  const wfTotal = wfQuery.data?.total ?? 0;
  const wfTotalPages = Math.ceil(wfTotal / PER_PAGE);

  const handleCreate = () => {
    if (activeTab === 'workflows') {
      navigate('/playbooks/new?type=workflow');
    } else {
      navigate('/playbooks/new');
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <BookOpen className="h-7 w-7 text-primary/60" />
          <h1 className="text-2xl font-bold">{fr.playbooks.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {language === 'en' && (
            <Button variant="outline" size="sm" onClick={() => setTranslationsOpen(true)}>
              <Languages className="h-4 w-4 mr-2" />
              {fr.playbooks.manageTranslations}
            </Button>
          )}
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {activeTab === 'workflows' ? fr.workflows.create : fr.playbooks.create}
          </Button>
        </div>
      </div>

      <PlaybookTranslationsDialog open={translationsOpen} onClose={() => setTranslationsOpen(false)} />

      {/* Suggested playbook */}
      <SuggestedPlaybook />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'playbooks' | 'workflows')}>
        <TabsList>
          <TabsTrigger value="playbooks">{fr.playbooks.title}</TabsTrigger>
          <TabsTrigger value="workflows">{fr.workflows.title}</TabsTrigger>
        </TabsList>

        {/* Playbooks tab */}
        <TabsContent value="playbooks" className="space-y-4 mt-4">
          <FilterBar
            filterStatus={pbFilterStatus}
            filterType={pbFilterType}
            filterCategory={pbFilterCategory}
            onStatusChange={(v) => { setPbFilterStatus(v); setPbPage(1); }}
            onTypeChange={(v) => { setPbFilterType(v); setPbPage(1); }}
            onCategoryChange={(v) => { setPbFilterCategory(v); setPbPage(1); }}
          />
          <ContentGrid
            items={pbPlaybooks}
            isLoading={pbQuery.isLoading}
            error={pbQuery.error}
            emptyTitle={fr.playbooks.noPlaybooks}
            emptyDesc={fr.playbooks.noPlaybooksDesc}
            onCreateClick={handleCreate}
            createLabel={fr.playbooks.create}
            renderCard={(pb) => <PlaybookCard key={pb.id} playbook={pb} />}
          />
          <PaginationBar
            page={pbPage}
            totalPages={pbTotalPages}
            total={pbTotal}
            perPage={PER_PAGE}
            onPageChange={setPbPage}
          />
        </TabsContent>

        {/* Workflows tab */}
        <TabsContent value="workflows" className="space-y-4 mt-4">
          <FilterBar
            filterStatus={wfFilterStatus}
            filterType={wfFilterType}
            filterCategory={wfFilterCategory}
            onStatusChange={(v) => { setWfFilterStatus(v); setWfPage(1); }}
            onTypeChange={(v) => { setWfFilterType(v); setWfPage(1); }}
            onCategoryChange={(v) => { setWfFilterCategory(v); setWfPage(1); }}
          />
          <ContentGrid
            items={wfPlaybooks}
            isLoading={wfQuery.isLoading}
            error={wfQuery.error}
            emptyTitle={fr.workflows.noWorkflows}
            emptyDesc={fr.workflows.noWorkflowsDesc}
            onCreateClick={handleCreate}
            createLabel={fr.workflows.create}
            renderCard={(pb) => <WorkflowCard key={pb.id} playbook={pb} />}
          />
          <PaginationBar
            page={wfPage}
            totalPages={wfTotalPages}
            total={wfTotal}
            perPage={PER_PAGE}
            onPageChange={setWfPage}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- Sub-components ---

function FilterBar({
  filterStatus,
  filterType,
  filterCategory,
  onStatusChange,
  onTypeChange,
  onCategoryChange,
}: {
  filterStatus: string;
  filterType: string;
  filterCategory: string;
  onStatusChange: (v: string) => void;
  onTypeChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
}) {
  const fr = useT();
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Select value={filterStatus} onValueChange={onStatusChange}>
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

      <Select value={filterType} onValueChange={onTypeChange}>
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

      <Select value={filterCategory} onValueChange={onCategoryChange}>
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
  );
}

function ContentGrid({
  items,
  isLoading,
  error,
  emptyTitle,
  emptyDesc,
  onCreateClick,
  createLabel,
  renderCard,
}: {
  items: Playbook[];
  isLoading: boolean;
  error: Error | null;
  emptyTitle: string;
  emptyDesc: string;
  onCreateClick: () => void;
  createLabel: string;
  renderCard: (pb: Playbook) => React.ReactNode;
}) {
  const fr = useT();
  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6">
          <p className="text-destructive text-sm">{fr.common.error} : {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-lg font-medium text-muted-foreground">{emptyTitle}</p>
          <p className="text-sm text-muted-foreground mt-1">{emptyDesc}</p>
          <p className="text-xs text-muted-foreground/60 mt-2 max-w-xs">{fr.suggestedPlaybook.analyzingPortfolio}</p>
          <Button className="mt-6" onClick={onCreateClick}>
            <Plus className="h-4 w-4 mr-2" />
            {createLabel}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map(renderCard)}
    </div>
  );
}

function PaginationBar({
  page,
  totalPages,
  total,
  perPage,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  perPage: number;
  onPageChange: (page: number) => void;
}) {
  const fr = useT();
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        {fr.common.showing} {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} {fr.common.of} {total}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          {fr.common.previous}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          {fr.common.next}
        </Button>
      </div>
    </div>
  );
}
