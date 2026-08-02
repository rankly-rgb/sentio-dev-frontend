import { useT } from '@/lib/i18n/useT';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PlaybookDetailEligibleAccounts } from '@/lib/types/playbook';

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md bg-secondary px-4 py-3">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-[20px] font-medium mt-0.5">{value}</p>
    </div>
  );
}

function formatCurrency(cents: number, currency: string): string {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: currency.toUpperCase() });
}

interface Props {
  eligible: PlaybookDetailEligibleAccounts;
}

export default function PlaybookAffectedAccounts({ eligible }: Props) {
  const fr = useT();
  const { user } = useAuth();
  const currency = user?.currency ?? 'usd';
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{fr.playbooks.affectedAccountsTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 3 stat cards */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label={fr.playbooks.affectedAccountsTitle}
            value={eligible.total}
          />
          <StatCard
            label={fr.playbooks.mrrAtRisk}
            value={formatCurrency(eligible.mrr_at_risk_cents, currency)}
          />
          <StatCard
            label={fr.playbooks.urgencyUrgent}
            value={eligible.urgent_count}
          />
        </div>

        {/* Tag row */}
        <p className="text-sm text-muted-foreground">
          {fr.playbooks.urgencyUrgent} : {eligible.urgent_count}
          {' · '}
          {fr.playbooks.urgencySurveiller} : {eligible.surveiller_count}
          {' · '}
          {fr.playbooks.urgencyStable} : {eligible.stable_count}
        </p>
      </CardContent>
    </Card>
  );
}
