import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'tok' } },
      }),
    },
  },
}));

vi.mock('@/utils/productionLogger', () => ({
  logger: { log: vi.fn(), perf: vi.fn() },
}));

// fetchWithUserJwt uses a module-level constant for SUPABASE_URL so we stub the env
// before any import occurs — done via vitest's stubEnv in beforeEach with resetModules.
beforeEach(() => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
  vi.resetModules();
});

describe('TrialExpiredError', () => {
  it('is an Error with status 402 and correct name', async () => {
    const { TrialExpiredError } = await import('../fetchWithUserJwt');
    const err = new TrialExpiredError();
    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(402);
    expect(err.name).toBe('TrialExpiredError');
  });
});

describe('fetchWithUserJwt — 402 handling', () => {
  it('throws TrialExpiredError on 402 response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 402,
      json: async () => ({ error: 'Trial expired' }),
    }));
    const { fetchWithUserJwt, TrialExpiredError } = await import('../fetchWithUserJwt');
    await expect(fetchWithUserJwt('some-fn')).rejects.toBeInstanceOf(TrialExpiredError);
  });

  it('throws generic Error (not TrialExpiredError) on 403 response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: 'Forbidden' }),
    }));
    const { fetchWithUserJwt, TrialExpiredError } = await import('../fetchWithUserJwt');
    const err = await fetchWithUserJwt('some-fn').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err).not.toBeInstanceOf(TrialExpiredError);
    expect((err as Error).message).toBe('Forbidden');
  });

  it('resolves normally on 200 response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: 'ok' }),
    }));
    const { fetchWithUserJwt } = await import('../fetchWithUserJwt');
    await expect(fetchWithUserJwt('some-fn')).resolves.toEqual({ data: 'ok' });
  });
});
