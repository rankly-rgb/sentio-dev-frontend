const isDev = import.meta.env.DEV;

export function devLog(context: string, ...args: unknown[]): void {
  if (isDev) console.log(`[${context}]`, ...args);
}

export function devWarn(context: string, ...args: unknown[]): void {
  if (isDev) console.warn(`[${context}]`, ...args);
}

export function devError(context: string, ...args: unknown[]): void {
  if (isDev) console.error(`[${context}]`, ...args);
}
