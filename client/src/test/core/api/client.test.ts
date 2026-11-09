import { api, setUnauthorizedHandler } from '@/core/api/client';
import { ApiError } from '@/core/api/error';

const respond = (status: number, body?: unknown) =>
  vi.fn().mockResolvedValue({ status, ok: status < 400, json: async () => body });

afterEach(() => {
  vi.unstubAllGlobals();
  setUnauthorizedHandler(undefined);
});

describe('api client', () => {
  it('unwraps data and pagination meta from the envelope', async () => {
    const meta = { page: 1, pageSize: 12, total: 1, totalPages: 1 };
    vi.stubGlobal('fetch', respond(200, { success: true, data: [{ id: 'a' }], meta }));

    const result = await api.get<{ id: string }[]>('/courses', {
      query: { q: 'react', page: 1, empty: '' },
    });

    expect(result).toEqual({ data: [{ id: 'a' }], meta });
    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]![0] as string;
    expect(url).toBe('/api/v1/courses?q=react&page=1'); // empty values are dropped
  });

  it('sends a JSON body and the browser cookies, but no Authorization header', async () => {
    vi.stubGlobal('fetch', respond(200, { success: true, data: {} }));

    await api.post('/courses', { title: 'x' });

    const init = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]![1] as RequestInit;
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{"title":"x"}');
    expect(init.credentials).toBe('include'); // the httpOnly cookie travels with the request
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('turns API failures into ApiError with the server message and field details', async () => {
    const error = {
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
      details: [{ path: 'title', message: 'Too short' }],
    };
    vi.stubGlobal('fetch', respond(400, { success: false, error }));

    const failure = await api.post('/courses', {}).catch((e: unknown) => e);

    expect(failure).toBeInstanceOf(ApiError);
    expect(failure).toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
    });
    expect((failure as ApiError).details[0]?.path).toBe('title');
  });

  it('reports a dropped connection as a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const failure = (await api.get('/courses').catch((e: unknown) => e)) as ApiError;
    expect(failure.isNetwork).toBe(true);
  });

  it('calls the unauthorized handler on a 401, except for the sign-in calls', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    vi.stubGlobal(
      'fetch',
      respond(401, { success: false, error: { code: 'UNAUTHORIZED', message: 'Nope' } }),
    );

    await api.post('/auth/login', {}).catch(() => undefined); // wrong password: not an expired session
    expect(handler).not.toHaveBeenCalled();

    await api.get('/enrollments/me').catch(() => undefined);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('handles 204 responses', async () => {
    vi.stubGlobal('fetch', respond(204));
    await expect(api.delete('/courses/1')).resolves.toEqual({ data: undefined });
  });
});

describe('api client: renewing the session', () => {
  const reply = (status: number, body?: unknown) => ({
    status,
    ok: status < 400,
    json: async () => body,
  });
  const unauthorized = { success: false, error: { code: 'UNAUTHORIZED', message: 'Expired' } };

  it('renews an expired session once and repeats the request', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(reply(401, unauthorized)) // the request, with an expired access token
      .mockResolvedValueOnce(reply(200)) // POST /auth/refresh
      .mockResolvedValueOnce(reply(200, { success: true, data: { id: 'a' } })); // the request again
    vi.stubGlobal('fetch', fetchMock);

    const result = await api.get<{ id: string }>('/courses/a');

    expect(result.data).toEqual({ id: 'a' });
    expect(fetchMock.mock.calls[1]![0]).toBe('/api/v1/auth/refresh');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('shares one renewal between requests that fail together', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith('/auth/refresh')) return reply(200);
      const done = fetchMock.mock.calls.filter(([u]) => u === url).length > 1;
      return done ? reply(200, { success: true, data: {} }) : reply(401, unauthorized);
    });
    vi.stubGlobal('fetch', fetchMock);

    await Promise.all([api.get('/a'), api.get('/b')]);

    expect(fetchMock.mock.calls.filter(([u]) => String(u).endsWith('/auth/refresh'))).toHaveLength(
      1,
    );
  });

  it('signs out when the session cannot be renewed', async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        String(url).endsWith('/auth/refresh') ? reply(401, unauthorized) : reply(401, unauthorized),
      ),
    );

    await expect(api.get('/courses/a')).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it('does not try to renew a wrong password', async () => {
    const fetchMock = vi.fn().mockResolvedValue(reply(401, unauthorized));
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.post('/auth/login', {})).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
