import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useSession, useSignOut } from '@/core/hooks/queries/use-auth';

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

const user = { id: '1', name: 'Leo', email: 'leo@x.dev', role: 'LEARNER', createdAt: '' };
const reply = (status: number, body: unknown) =>
  vi.fn().mockResolvedValue({ status, ok: status < 400, json: async () => body });

afterEach(() => vi.unstubAllGlobals());

describe('useSession', () => {
  it('is authenticated when the server says who the cookie belongs to', async () => {
    vi.stubGlobal('fetch', reply(200, { success: true, data: user }));

    const { result } = renderHook(() => useSession(), { wrapper });
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('authenticated'));
    expect(result.current.user).toEqual(user);
  });

  it('is a guest when the server answers 401 (no cookie, or it expired)', async () => {
    vi.stubGlobal(
      'fetch',
      reply(401, { success: false, error: { code: 'UNAUTHORIZED', message: 'Nope' } }),
    );

    const { result } = renderHook(() => useSession(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('guest'));
    expect(result.current.user).toBeNull();
  });

  it('does NOT treat the person as signed out when the check fails for another reason', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    const { result } = renderHook(() => useSession(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('error'));
  });
});

describe('useSignOut', () => {
  it('asks the server to end the session, then the app shows a guest', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({ success: true, data: user }),
      })
      .mockResolvedValue({ status: 204, ok: true });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => ({ session: useSession(), signOut: useSignOut() }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.session.status).toBe('authenticated'));

    await result.current.signOut();

    const [url, init] = fetchMock.mock.calls[1]!;
    expect(url).toContain('/auth/logout');
    expect(init.method).toBe('POST');
    await waitFor(() => expect(result.current.session.status).toBe('guest'));
  });
});
