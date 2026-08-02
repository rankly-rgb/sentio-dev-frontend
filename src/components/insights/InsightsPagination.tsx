import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/useT';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { InsightsPagination as PaginationType } from '@/types/insights';

interface InsightsPaginationProps {
  pagination: PaginationType;
  onPageChange: (page: number) => void;
}

export default function InsightsPagination({ pagination, onPageChange }: InsightsPaginationProps) {
  const fr = useT();
  const { page, per_page, total_count } = pagination;
  const total_pages = Math.max(1, Math.ceil(total_count / per_page));
  if (total_pages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm text-muted-foreground">
        Page {page} {fr.common.of} {total_pages} — {total_count} {fr.insights.results}
      </p>
      <div className="flex gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= total_pages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
