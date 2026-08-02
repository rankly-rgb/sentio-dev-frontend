import { useT } from '@/lib/i18n/useT';
import { Badge } from '@/components/ui/badge';
import type { AccountPriorityLabel } from '@/lib/types/accounts';

const PRIORITY_STYLES: Record<AccountPriorityLabel, string> = {
  churned: 'bg-gray-100 text-gray-500 border border-gray-200',
  critical: 'bg-red-100 text-red-700 border border-red-200',
  watch: 'bg-orange-100 text-orange-700 border border-orange-200',
  stable: 'bg-green-100 text-green-700 border border-green-200',
  new: 'bg-blue-100 text-blue-700 border border-blue-200',
};

interface Props {
  priority: AccountPriorityLabel | null;
  onClick?: (priority: AccountPriorityLabel) => void;
}

export default function AccountPriorityBadge({ priority, onClick }: Props) {
  const fr = useT();
  if (!priority) return <span className="text-muted-foreground">—</span>;

  const label = fr.accountPriority[priority];

  return (
    <Badge
      variant="outline"
      className={`${PRIORITY_STYLES[priority]} font-medium ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
      onClick={onClick ? (e) => { e.stopPropagation(); onClick(priority); } : undefined}
    >
      {label}
    </Badge>
  );
}
