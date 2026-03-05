import { describe, it, expect, vi, beforeEach } from 'vitest';

// Must mock import.meta.env before importing
vi.stubEnv('DEV', true);

describe('productionLogger', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('logger.log outputs in dev mode', async () => {
    vi.stubEnv('DEV', true);
    // Re-import to pick up env change
    vi.resetModules();
    const { logger } = await import('../productionLogger');
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.log('Test', 'hello');
    expect(spy).toHaveBeenCalledWith('[Test] hello', '');
  });

  it('logger.warn always outputs', async () => {
    vi.stubEnv('DEV', false);
    vi.resetModules();
    const { logger } = await import('../productionLogger');
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('Ctx', 'warning msg', { key: 'val' });
    expect(spy).toHaveBeenCalledWith('[Ctx] warning msg', { key: 'val' });
  });

  it('logger.error always outputs', async () => {
    vi.stubEnv('DEV', false);
    vi.resetModules();
    const { logger } = await import('../productionLogger');
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('Ctx', 'error msg');
    expect(spy).toHaveBeenCalledWith('[Ctx] error msg', '');
  });
});
