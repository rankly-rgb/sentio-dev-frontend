/**
 * TEMP DEBUG — Détecte les long tasks (>50ms) qui bloquent le thread principal.
 * Deux mécanismes complémentaires :
 * 1. PerformanceObserver('longtask') — API native, précis mais pas supporté partout
 * 2. RAF heartbeat — détecte les freezes >500ms via requestAnimationFrame gaps
 *
 * À retirer après diagnostic des freezes intermittents.
 */
import { logger } from './productionLogger';

// --- 1. PerformanceObserver pour les long tasks (>50ms) ---
if (typeof PerformanceObserver !== 'undefined') {
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Only log tasks >100ms to reduce noise (50ms threshold is very sensitive)
        if (entry.duration > 100) {
          logger.warn('LongTask', `UI blocked for ${entry.duration.toFixed(0)}ms`, {
            name: entry.name,
            startTime: entry.startTime.toFixed(0),
            duration: entry.duration.toFixed(0),
          });
        }
      }
    });
    observer.observe({ entryTypes: ['longtask'] });
    logger.log('LongTask', 'PerformanceObserver registered');
  } catch {
    logger.log('LongTask', 'PerformanceObserver not supported for longtask');
  }
}

// --- 2. RAF heartbeat — détecte les freezes >500ms ---
let lastFrameTime = performance.now();
const FREEZE_THRESHOLD_MS = 500;

function heartbeat() {
  const now = performance.now();
  const gap = now - lastFrameTime;

  if (gap > FREEZE_THRESHOLD_MS) {
    logger.error('UIFreeze', `Frame gap ${gap.toFixed(0)}ms (>${FREEZE_THRESHOLD_MS}ms threshold)`, {
      gapMs: gap.toFixed(0),
      lastFrameAgo: `${(gap / 1000).toFixed(1)}s`,
    });
  }

  lastFrameTime = now;
  requestAnimationFrame(heartbeat);
}

if (typeof requestAnimationFrame !== 'undefined') {
  requestAnimationFrame(heartbeat);
  logger.log('UIFreeze', 'RAF heartbeat started');
}
