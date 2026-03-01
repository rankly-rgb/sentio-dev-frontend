import { Skeleton } from '@/components/ui/skeleton';

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <Skeleton className="h-7 w-32 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card rounded-2xl border border-border/50 shadow-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-10 w-10 rounded-xl" />
            </div>
            <Skeleton className="h-9 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Global Scores + Heart Smart Alert */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-card rounded-2xl border border-border/50 shadow-card p-6">
          <Skeleton className="h-4 w-28 mb-1" />
          <Skeleton className="h-3 w-40 mb-6" />
          <div className="flex justify-around py-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="h-28 w-28 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 shadow-card p-6 space-y-4">
          <div className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-28" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      {/* Playbook Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-2xl border border-border/50 shadow-card p-5 space-y-3">
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Integration Status */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-card rounded-2xl border border-border/50 shadow-card p-6">
          <Skeleton className="h-4 w-32 mb-1" />
          <Skeleton className="h-3 w-40 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
