// TODO: retirer les appels logger.log() après résolution du freeze — date audit: 2026-05-17

function meta(): { ts: string; url: string } {
  return {
    ts: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.pathname : '',
  };
}

export const logger = {
  log(context: string, message: string, data?: unknown) {
    if (!import.meta.env.DEV) return;
    console.log(`[${context}] ${message}`, data !== undefined ? data : '', meta());
  },

  warn(context: string, message: string, data?: unknown) {
    console.warn(`[${context}] ${message}`, data !== undefined ? data : '', meta());
  },

  error(context: string, message: string, data?: unknown) {
    console.error(`[${context}] ${message}`, data !== undefined ? data : '', meta());
  },

  perf(context: string, label: string, durationMs: number) {
    const level = durationMs > 10_000 ? 'error' : durationMs > 3_000 ? 'warn' : 'log';
    const msg = `${label} took ${durationMs.toFixed(0)}ms`;
    if (level === 'error') {
      console.error(`[${context}] SLOW ${msg}`, meta());
    } else if (level === 'warn') {
      console.warn(`[${context}] SLOW ${msg}`, meta());
    } else {
      if (!import.meta.env.DEV) return;
      console.log(`[${context}] ${msg}`, meta());
    }
  },
};
