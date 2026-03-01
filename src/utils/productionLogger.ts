/**
 * Lightweight logger that works in both dev and production.
 * In production, logs are minimal (warns/errors only).
 * In dev, all levels are logged with context.
 */
const isDev = import.meta.env.DEV;

export const logger = {
  log(context: string, message: string, data?: unknown) {
    if (isDev) {
      console.log(`[${context}] ${message}`, data !== undefined ? data : '');
    }
  },

  warn(context: string, message: string, data?: unknown) {
    console.warn(`[${context}] ${message}`, data !== undefined ? data : '');
  },

  error(context: string, message: string, data?: unknown) {
    console.error(`[${context}] ${message}`, data !== undefined ? data : '');
  },
};
