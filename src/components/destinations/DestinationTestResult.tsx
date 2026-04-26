import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { fr } from '@/i18n/fr';
import type { TestDestinationResponse } from '@/lib/types/webhook-destinations';

interface Props {
  isPending: boolean;
  data?: TestDestinationResponse;
  error?: Error | null;
}

export default function DestinationTestResult({ isPending, data, error }: Props) {
  if (isPending) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2 p-2 rounded-md bg-muted/50">
        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
        {fr.destinations.test.testing}
      </div>
    );
  }

  if (error || (data && !data.success)) {
    const status = data?.status ?? 0;
    return (
      <div className="flex items-center gap-2 text-sm text-red-600 mt-2 p-2 rounded-md bg-red-50">
        <XCircle className="h-4 w-4 shrink-0" />
        {fr.destinations.test.failure(status)}
      </div>
    );
  }

  if (data?.success) {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-700 mt-2 p-2 rounded-md bg-emerald-50">
        <CheckCircle className="h-4 w-4 shrink-0" />
        {fr.destinations.test.success(data.status)}
      </div>
    );
  }

  return null;
}
