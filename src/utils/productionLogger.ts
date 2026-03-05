/**
 * Lightweight logger that works in both dev and production.
 * In production, all levels are now logged (with structured context) to make
 * freezes and silent errors visible.
 */

// TEMP DEBUG — log() enabled in production to diagnose intermittent freezes
function meta(): { ts: string; url: string } {
  return {
    ts: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.pathname : '',
  };
}

export const logger = {
  log(context: string, message: string, data?: unknown) {
    // TEMP DEBUG — was dev-only, now always logs for freeze diagnosis
    console.log(`[${context}] ${message}`, data !== undefined ? data : '', meta());
  },

  warn(context: string, message: string, data?: unknown) {
    console.warn(`[${context}] ${message}`, data !== undefined ? data : '', meta());
  },

  error(context: string, message: string, data?: unknown) {
    console.error(`[${context}] ${message}`, data !== undefined ? data : '', meta());
  },

  /** TEMP DEBUG — Log performance timing for slow operations */
  perf(context: string, label: string, durationMs: number) {
    const level = durationMs > 10_000 ? 'error' : durationMs > 3_000 ? 'warn' : 'log';
    const msg = `${label} took ${durationMs.toFixed(0)}ms`;
    if (level === 'error') {
      console.error(`[${context}] SLOW ${msg}`, meta());
    } else if (level === 'warn') {
      console.warn(`[${context}] SLOW ${msg}`, meta());
    } else {
      console.log(`[${context}] ${msg}`, meta());
    }
  },
};
