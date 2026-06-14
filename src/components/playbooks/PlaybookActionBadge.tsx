import { Mail, Download, FileText, Flag } from 'lucide-react';
import { useT } from '@/lib/i18n/useT';
import type { PlaybookActionType } from '@/lib/types/playbook';

interface Props {
  actionType: PlaybookActionType;
}

const ACTION_CONFIG: Record<PlaybookActionType, {
  Icon: React.ElementType;
  className: string;
}> = {
  send_email: {
    Icon: Mail,
    className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  export_csv: {
    Icon: Download,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  log_note: {
    Icon: FileText,
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  },
  flag_for_review: {
    Icon: Flag,
    className: 'bg-orange-50 text-orange-700 border-orange-200',
  },
};

export default function PlaybookActionBadge({ actionType }: Props) {
  const fr = useT();
  const config = ACTION_CONFIG[actionType];
  if (!config) return null;
  const { Icon } = config;
  const label = fr.playbooks.actionBadge[actionType] ?? actionType;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${config.className}`}
    >
      <Icon className="h-3 w-3 shrink-0" />
      {label}
    </span>
  );
}
