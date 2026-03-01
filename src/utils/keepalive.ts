import { logger } from './productionLogger';

class Keepalive {
  private intervalId: number | null = null;
  private readonly intervalMs = 30_000; // 30 seconds

  start() {
    if (this.intervalId !== null) return;
    logger.log('Keepalive', 'Starting heartbeat');
    this.intervalId = window.setInterval(() => {
      if (!document.hidden) {
        logger.log('Keepalive', 'Heartbeat (tab active)');
      }
    }, this.intervalMs);
  }

  stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.log('Keepalive', 'Stopped');
    }
  }
}

export const keepalive = new Keepalive();
