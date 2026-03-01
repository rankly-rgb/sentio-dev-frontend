import { useEffect, useRef } from 'react';
import { visibilityMonitor } from '@/utils/visibilityMonitor';
import { logger } from '@/utils/productionLogger';

/**
 * Triggers a refetch callback when tab becomes visible after extended inactivity (>5 min).
 */
export function useVisibilityRefetch(
  refetchCallback: () => void | Promise<void>,
  hookName: string,
  enabled: boolean = true,
) {
  const callbackRef = useRef(refetchCallback);

  useEffect(() => {
    callbackRef.current = refetchCallback;
  }, [refetchCallback]);

  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = visibilityMonitor.onReturn(async () => {
      logger.log('useVisibilityRefetch', `Refetching ${hookName}`);
      try {
        await callbackRef.current();
      } catch (error) {
        logger.error('useVisibilityRefetch', `Refetch failed for ${hookName}`, error);
      }
    });

    return unsubscribe;
  }, [enabled, hookName]);
}
