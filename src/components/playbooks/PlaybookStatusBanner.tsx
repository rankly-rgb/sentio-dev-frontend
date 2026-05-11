import { Info, CheckCircle, Archive } from 'lucide-react';
import { useT } from '@/lib/i18n/useT';
import type { PlaybookStatus, PlaybookAffectedAccountsSummary } from '@/lib/types/playbook';

interface Props {
  status: PlaybookStatus;
  affectedSummary: PlaybookAffectedAccountsSummary;
}

const bannerConfig: Record<
  'draft' | 'active' | 'archived',
  { icon: React.ElementType; className: string }
> = {
  draft: {
    icon: Info,
    className: 'bg-blue-50 border-blue-200 text-blue-800',
  },
  active: {
    icon: CheckCircle,
    className: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  },
  archived: {
    icon: Archive,
    className: 'bg-gray-50 border-gray-200 text-gray-600',
  },
};

export default function PlaybookStatusBanner({ status, affectedSummary }: Props) {
  const fr = useT();
  const key = status as 'draft' | 'active' | 'archived';

  function getBannerText(s: PlaybookStatus, total: number): string | null {
    switch (s) {
      case 'draft': return fr.playbooks.bannerDraft(total);
      case 'active': return fr.playbooks.bannerActive(total);
      case 'archived': return fr.playbooks.bannerArchived;
      default: return null;
    }
  }
  const config = bannerConfig[key];
  if (!config) return null;

  const text = getBannerText(status, affectedSummary?.total ?? 0);
  if (!text) return null;

  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm ${config.className}`}>
      <Icon className="h-4 w-4 shrink-0" />
      <span>{text}</span>
    </div>
  );
}
