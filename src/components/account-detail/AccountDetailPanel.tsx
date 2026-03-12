import { fr } from '@/i18n/fr';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import AccountHeader from './AccountHeader';
import AccountScoreCard from './AccountScoreCard';
import AccountFinancials from './AccountFinancials';
import AccountTimeline from './AccountTimeline';
import AccountInsights from './AccountInsights';
import AccountScoreHistory from './AccountScoreHistory';
import AccountUsageSection from './AccountUsageSection';
import AccountActions from './AccountActions';
import type { AccountDetail } from '@/lib/types/accounts';

// ─── Section wrapper ─────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function PanelSkeleton() {
  return (
    <div className="space-y-6 p-1">
      <div className="space-y-2">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

// ─── Panel ───────────────────────────────────────────────────────────────────

interface Props {
  isOpen: boolean;
  onClose: () => void;
  account: AccountDetail | null;
  isLoading: boolean;
}

export default function AccountDetailPanel({ isOpen, onClose, account, isLoading }: Props) {
  const { organization } = useOrganizationSettings();
  const trackerConnected = organization?.usage_tracker_connected ?? false;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[480px] p-0 flex flex-col"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>
            {account ? account.stripe_customer_id : fr.common.loading}
          </SheetTitle>
          <SheetDescription>
            {fr.accountDetail.overview}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="space-y-6 p-6 pb-24">
            {isLoading || !account ? (
              <PanelSkeleton />
            ) : (
              <>
                {/* 1. Header */}
                <AccountHeader account={account} />

                {/* 2. Score Card */}
                <Section title={fr.scores.healthScore}>
                  <AccountScoreCard account={account} trackerConnected={trackerConnected} />
                </Section>

                {/* 3. Financials */}
                <Section title={fr.panel.financials}>
                  <AccountFinancials account={account} />
                </Section>

                {/* 4. Score History */}
                <Section title={fr.accountDetail.scoreHistory}>
                  <AccountScoreHistory scoreHistory={account.score_history} />
                </Section>

                {/* 5. Insights */}
                <Section title={fr.insights.accountInsightsTitle}>
                  <AccountInsights accountId={account.id} />
                </Section>

                {/* 6. Timeline */}
                <Section title={fr.panel.timeline}>
                  <AccountTimeline accountId={account.id} flags={account.flags} />
                </Section>

                {/* 7. Usage */}
                <Section title={fr.accountDetail.usage}>
                  <AccountUsageSection
                    usageEvents={account.recent_usage}
                    trackerConnected={trackerConnected}
                  />
                </Section>
              </>
            )}
          </div>
        </ScrollArea>

        {/* 8. Sticky footer — Actions */}
        {account && !isLoading && (
          <div className="border-t bg-background px-6 py-3">
            <AccountActions account={account} />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
