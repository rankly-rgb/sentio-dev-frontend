import { logger } from './productionLogger';

type NetworkCallback = (online: boolean) => void | Promise<void>;

class NetworkMonitor {
  private callbacks: NetworkCallback[] = [];
  private wasOffline = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  private handleOnline = async () => {
    logger.log('NetworkMonitor', 'Network restored');
    if (this.wasOffline) {
      for (const cb of this.callbacks) {
        try { await cb(true); } catch (e) { logger.error('NetworkMonitor', 'Online callback error', e); }
      }
    }
    this.wasOffline = false;
  };

  private handleOffline = async () => {
    logger.warn('NetworkMonitor', 'Network lost');
    this.wasOffline = true;
    for (const cb of this.callbacks) {
      try { await cb(false); } catch (e) { logger.error('NetworkMonitor', 'Offline callback error', e); }
    }
  };

  /** Register callback for network status changes. Returns unsubscribe fn. */
  onConnectionChange(callback: NetworkCallback): () => void {
    this.callbacks.push(callback);
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) this.callbacks.splice(index, 1);
    };
  }

  isOnline() {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  cleanup() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
    this.callbacks = [];
  }
}

export const networkMonitor = new NetworkMonitor();
