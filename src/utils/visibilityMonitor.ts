import { logger } from './productionLogger';

type VisibilityCallback = () => void | Promise<void>;

class VisibilityMonitor {
  private callbacks: VisibilityCallback[] = [];
  private wasHiddenAt: number | null = null;
  private inactivityThresholdMs = 5 * 60 * 1000; // 5 minutes

  constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  private handleVisibilityChange = async () => {
    if (document.hidden) {
      this.wasHiddenAt = Date.now();
      logger.log('VisibilityMonitor', 'Tab hidden');
    } else {
      const hiddenDuration = this.wasHiddenAt
        ? Date.now() - this.wasHiddenAt
        : 0;

      logger.log('VisibilityMonitor', 'Tab visible again', {
        hiddenMs: hiddenDuration,
        hiddenMinutes: Math.floor(hiddenDuration / 60000),
      });

      if (hiddenDuration > this.inactivityThresholdMs) {
        logger.warn(
          'VisibilityMonitor',
          `Tab was hidden for ${Math.floor(hiddenDuration / 60000)} minutes, triggering recovery`,
        );

        for (const callback of this.callbacks) {
          try {
            await callback();
          } catch (error) {
            logger.error('VisibilityMonitor', 'Recovery callback error', error);
          }
        }
      }

      this.wasHiddenAt = null;
    }
  };

  /** Register a callback for when tab returns after extended inactivity (>5 min). Returns unsubscribe fn. */
  onReturn(callback: VisibilityCallback): () => void {
    this.callbacks.push(callback);
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) this.callbacks.splice(index, 1);
    };
  }

  cleanup() {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
    this.callbacks = [];
  }
}

export const visibilityMonitor = new VisibilityMonitor();
