import { describe, it, expect, vi, beforeEach } from 'vitest';

// Must mock import.meta.env before importing
vi.stubEnv('DEV', true);

describe('productionLogger', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('logger.log outputs with meta context', async () => {
    vi.stubEnv('DEV', true);
    vi.resetModules();
    const { logger } = await import('../productionLogger');
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.log('Test', 'hello');
    expect(spy).toHaveBeenCalledWith(
      '[Test] hello',
      '',
      expect.objectContaining({ ts: expect.any(String), url: expect.any(String) }),
    );
  });

  it('logger.warn always outputs with meta context', async () => {
    vi.stubEnv('DEV', false);
    vi.resetModules();
    const { logger } = await import('../productionLogger');
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('Ctx', 'warning msg', { key: 'val' });
    expect(spy).toHaveBeenCalledWith(
      '[Ctx] warning msg',
      { key: 'val' },
      expect.objectContaining({ ts: expect.any(String), url: expect.any(String) }),
    );
  });

  it('logger.error always outputs with meta context', async () => {
    vi.stubEnv('DEV', false);
    vi.resetModules();
    const { logger } = await import('../productionLogger');
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('Ctx', 'error msg');
    expect(spy).toHaveBeenCalledWith(
      '[Ctx] error msg',
      '',
      expect.objectContaining({ ts: expect.any(String), url: expect.any(String) }),
    );
  });

  it('logger.perf logs timing with correct level', async () => {
    vi.resetModules();
    const { logger } = await import('../productionLogger');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logger.perf('Test', 'fast-op', 500);
    expect(logSpy).toHaveBeenCalledWith(
      '[Test] fast-op took 500ms',
      expect.objectContaining({ ts: expect.any(String) }),
    );

    logger.perf('Test', 'slow-op', 4000);
    expect(warnSpy).toHaveBeenCalledWith(
      '[Test] SLOW slow-op took 4000ms',
      expect.objectContaining({ ts: expect.any(String) }),
    );

    logger.perf('Test', 'very-slow-op', 12000);
    expect(errorSpy).toHaveBeenCalledWith(
      '[Test] SLOW very-slow-op took 12000ms',
      expect.objectContaining({ ts: expect.any(String) }),
    );
  });
});
