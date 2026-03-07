import { useParams, Navigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { fr } from '@/i18n/fr';
import type { SegmentType } from '@/lib/types/segments';
import { isValidSegmentKey } from '@/lib/types/segments';
import { useSegmentAccounts } from '@/hooks/useSegmentAccounts';
import SegmentDetailView from '@/components/segments/SegmentDetailView';

export default function SegmentDetail() {
  const { segment: segmentParam } = useParams<{ segment: string }>();
  const validSegment: SegmentType | null =
    segmentParam && isValidSegmentKey(segmentParam) ? segmentParam : null;

  const { data: accounts, isLoading, error } = useSegmentAccounts(validSegment);

  if (!validSegment) {
    return <Navigate to="/segments" replace />;
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-destructive">{fr.common.error}</p>
      </div>
    );
  }

  return (
    <SegmentDetailView
      segment={validSegment}
      accounts={accounts || []}
      totalFetched={accounts?.length ?? 0}
    />
  );
}
