import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase before importing
vi.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe('invokeWithServiceRole', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('throws when SERVICE_ROLE_KEY is missing', async () => {
    vi.stubEnv('VITE_SUPABASE_SERVICE_ROLE_KEY', '');
    const { invokeWithServiceRole } = await import('../invokeEdgeFunction');
    await expect(invokeWithServiceRole('test-fn')).rejects.toThrow('Missing configuration');
  });

  it('calls supabase.functions.invoke with correct params', async () => {
    vi.stubEnv('VITE_SUPABASE_SERVICE_ROLE_KEY', 'test-key-123');
    vi.resetModules();

    const { supabase } = await import('@/lib/supabase');
    const mockInvoke = vi.mocked(supabase.functions.invoke);
    mockInvoke.mockResolvedValue({ data: { result: 'ok' }, error: null });

    const { invokeWithServiceRole } = await import('../invokeEdgeFunction');
    const result = await invokeWithServiceRole<{ result: string }>('my-fn', { key: 'val' });

    expect(mockInvoke).toHaveBeenCalledWith('my-fn', expect.objectContaining({
      headers: { Authorization: 'Bearer test-key-123' },
      body: { key: 'val' },
    }));
    expect(result).toEqual({ result: 'ok' });
  });

  it('throws on Edge Function error', async () => {
    vi.stubEnv('VITE_SUPABASE_SERVICE_ROLE_KEY', 'test-key-123');
    vi.resetModules();

    const { supabase } = await import('@/lib/supabase');
    const mockInvoke = vi.mocked(supabase.functions.invoke);
    mockInvoke.mockResolvedValue({ data: null, error: { message: 'Not found' } });

    const { invokeWithServiceRole } = await import('../invokeEdgeFunction');
    await expect(invokeWithServiceRole('bad-fn')).rejects.toThrow('Edge Function "bad-fn"');
  });

  it('passes method when provided', async () => {
    vi.stubEnv('VITE_SUPABASE_SERVICE_ROLE_KEY', 'test-key-123');
    vi.resetModules();

    const { supabase } = await import('@/lib/supabase');
    const mockInvoke = vi.mocked(supabase.functions.invoke);
    mockInvoke.mockResolvedValue({ data: null, error: null });

    const { invokeWithServiceRole } = await import('../invokeEdgeFunction');
    await invokeWithServiceRole('fn', undefined, 'GET');

    expect(mockInvoke).toHaveBeenCalledWith('fn', expect.objectContaining({
      headers: { Authorization: 'Bearer test-key-123' },
      method: 'GET',
    }));
  });
});
