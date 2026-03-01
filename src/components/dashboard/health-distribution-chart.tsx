import { fr } from '@/i18n/fr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { HealthDistribution } from '@/types/dashboard';

interface Props {
  distribution: HealthDistribution;
}

export function HealthDistributionChart({ distribution }: Props) {
  const segments = [
    { label: fr.segments.champions, count: distribution.champions, color: 'bg-success' },
    { label: fr.segments.expanding, count: distribution.expanding, color: 'bg-primary' },
    { label: fr.segments.stable, count: distribution.stable, color: 'bg-blue-400' },
    { label: fr.segments.atRiskLight, count: distribution.at_risk_light, color: 'bg-warning' },
    { label: fr.segments.critical, count: distribution.critical, color: 'bg-destructive' },
    { label: fr.segments.newAccounts, count: distribution.new_accounts, color: 'bg-muted-foreground' },
  ];

  const total = segments.reduce((s, seg) => s + seg.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Répartition des segments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Barre empilée */}
        <div className="flex rounded-full overflow-hidden h-4">
          {segments.map(seg => (
            seg.count > 0 && (
              <div
                key={seg.label}
                className={`${seg.color} transition-all`}
                style={{ width: `${(seg.count / Math.max(total, 1)) * 100}%` }}
              />
            )
          ))}
        </div>
        {/* Légende */}
        <div className="grid grid-cols-2 gap-2">
          {segments.map(seg => (
            <div key={seg.label} className="flex items-center gap-2 text-sm">
              <div className={`w-3 h-3 rounded-full ${seg.color}`} />
              <span className="text-muted-foreground">{seg.label}</span>
              <span className="font-medium ml-auto">{seg.count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
