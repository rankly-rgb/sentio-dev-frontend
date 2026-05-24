import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useT } from '@/lib/i18n/useT';
import { Button } from '@/components/ui/button';
import { useTopChurnRisks } from '@/hooks/useOnboardingWizard';
import { cn } from '@/lib/utils';

interface Props {
  onConnectHubspot: () => void;
}

function healthBadgeClass(score: number) {
  if (score >= 70) return 'bg-green-100 text-green-700';
  if (score >= 40) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
}

function churnBadgeClass(score: number) {
  if (score >= 70) return 'bg-red-100 text-red-700';
  if (score >= 40) return 'bg-amber-100 text-amber-700';
  return 'bg-green-100 text-green-700';
}

export default function StepFirstWin({ onConnectHubspot }: Props) {
  const t = useT();
  const w = t.onboardingWizard.firstWin;
  const navigate = useNavigate();
  const { data, isLoading } = useTopChurnRisks();

  const accounts = data?.accounts.slice(0, 3) ?? [];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900">{w.title}</h2>
        <p className="mt-1 text-sm text-gray-500">{w.subtitle}</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        </div>
      ) : accounts.length === 0 ? (
        <p className="text-sm text-center text-gray-400 py-6">{w.noAccounts}</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">{w.colAccount}</th>
                <th className="text-center px-4 py-2.5 text-xs font-medium text-gray-500">{w.colHealth}</th>
                <th className="text-center px-4 py-2.5 text-xs font-medium text-gray-500">{w.colChurn}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {accounts.map((acc) => (
                <tr key={acc.masked_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{acc.masked_id}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('inline-block px-2 py-0.5 rounded-full text-xs font-medium', healthBadgeClass(acc.health_score))}>
                      {acc.health_score}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('inline-block px-2 py-0.5 rounded-full text-xs font-medium', churnBadgeClass(acc.churn_risk_score))}>
                      {acc.churn_risk_score}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Button
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 font-semibold"
        onClick={() => navigate('/dashboard', { replace: true })}
      >
        {w.cta}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={onConnectHubspot}
          className="text-sm text-indigo-600 hover:underline"
        >
          {w.ctaHubspot}
        </button>
      </div>
    </div>
  );
}
