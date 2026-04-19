import { cn } from '@/lib/utils';

interface AccountNameProps {
  stripeId: string;
  displayName?: string | null;
  truncate?: boolean;
  className?: string;
}

function truncateId(id: string): string {
  if (id.length <= 14) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

export default function AccountName({ stripeId, displayName, truncate = true, className }: AccountNameProps) {
  if (displayName) {
    return <span className={cn('font-medium', className)}>{displayName}</span>;
  }

  return (
    <span className={cn('font-mono text-muted-foreground/80', className)}>
      {truncate ? truncateId(stripeId) : stripeId}
    </span>
  );
}
