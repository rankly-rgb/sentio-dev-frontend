import { AlertTriangle, AlertCircle, Info, CreditCard } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useT } from '@/lib/i18n/useT';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import type { TodayActionsSummary } from '@/lib/types/today-actions';

interface TodaySummaryBarProps {
  summary: TodayActionsSummary;
  onScrollTo: (priority: 'P0' | 'P1' | 'P2') => void;
}

export default function TodaySummaryBar({ summary, onScrollTo }: TodaySummaryBarProps) {
  const fr = useT();
  const { user } = useAuth();
  const currency = user?.currency ?? 'usd';
  const CARDS = [
    { key: 'P0' as const, label: fr.todayActions.critiques, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 hover:bg-red-100' },
    { key: 'P1' as const, label: fr.todayActions.hautes, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50 hover:bg-amber-100' },
    { key: 'P2' as const, label: fr.todayActions.normales, icon: Info, color: 'text-blue-600', bg: 'bg-blue-50 hover:bg-blue-100' },
  ] as const;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {CARDS.map(({ key, label, icon: Icon, color, bg }) => (
        <Card
          key={key}
          className={cn('p-4 cursor-pointer transition-colors border-0 shadow-sm', bg)}
          onClick={() => onScrollTo(key)}
        >
          <div className="flex items-center gap-2 mb-1">
            <Icon className={cn('h-4 w-4', color)} />
            <span className={cn('text-xs font-medium', color)}>{label}</span>
          </div>
          <p className={cn('text-2xl font-bold', color)}>
            {summary.by_priority[key]}
          </p>
        </Card>
      ))}

      <Card className="p-4 border-0 shadow-sm bg-slate-50">
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className="h-4 w-4 text-slate-600" />
          <span className="text-xs font-medium text-slate-600">{fr.todayActions.mrrAtRisk}</span>
        </div>
        <p className="text-2xl font-bold text-slate-800">
          {fr.format.currency(summary.mrr_at_risk_cents, currency)}
        </p>
      </Card>
    </div>
  );
}
