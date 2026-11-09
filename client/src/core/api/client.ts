import type {
  ApiFailure,
  ApiResult,
  ApiSuccess,
  RequestOptions,
  RequestParams,
} from '@/core/types/api.types';
import { MESSAGES } from '@/core/lib/messages';
import { ApiError } from './error';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

/** Called when the server says the session has ended (401), so the app can sign the user out. */
let onUnauthorized: (() => void) | undefined;
export const setUnauthorizedHandler = (handler: (() => void) | undefined) => {
  onUnauthorized = handler;
};

const buildUrl = (path: string, query: RequestOptions['query']) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  const qs = params.toString();
  return `${BASE_URL}${path}${qs ? `?${qs}` : ''}`;
};

/** Calls where a 401 means "wrong details", not "your session ran out", so there is nothing to renew. */
const NO_RENEWAL = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/reset-password',
];

let renewing: Promise<boolean> | null = null;

/**
 * Asks the server to renew the session from the refresh cookie. Several requests can fail at the same moment;
 * they share one renewal, because a refresh token works only once.
 */
const renewSession = () =>
  (renewing ??= fetch(`${BASE_URL}/auth/refresh`, { method: 'POST', credentials: 'include' })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      renewing = null;
    }));

/**
 * Typed fetch wrapper that understands the API envelope and always throws ApiError on failure.
 * Returns `{ data, meta }`; use `api.get/post/...` helpers below for the common cases.
 */
const request = async <T>(
  path: string,
  options: RequestOptions = {},
  renewed = false,
): Promise<ApiResult<T>> => {
  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      signal: options.signal,
      // The sign-in token lives in an httpOnly cookie: the browser attaches it, our code never sees it.
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(options.body !== undefined && { 'Content-Type': 'application/json' }),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause;
    throw new ApiError(MESSAGES.generic.network, 0, 'NETWORK');
  }

  // The short-lived sign-in ran out: renew it quietly and repeat the request once, so the person is not signed out.
  if (response.status === 401 && !renewed && !NO_RENEWAL.includes(path) && (await renewSession())) {
    return request<T>(path, options, true);
  }

  if (response.status === 204) return { data: undefined as T };

  const payload = (await response.json().catch(() => null)) as ApiSuccess<T> | ApiFailure | null;

  if (!response.ok || !payload || payload.success === false) {
    const failure = payload && payload.success === false ? payload.error : undefined;
    // A 401 anywhere except the sign-in calls themselves means the session is no longer valid.
    if (response.status === 401 && !path.startsWith('/auth/')) onUnauthorized?.();
    throw new ApiError(
      failure?.message ?? MESSAGES.generic.error,
      response.status,
      failure?.code ?? 'UNKNOWN',
      failure?.details,
    );
  }
  return { data: payload.data, meta: payload.meta };
};

export const api = {
  get: <T>(path: string, params?: RequestParams) => request<T>(path, { ...params }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T = void>(path: string) => request<T>(path, { method: 'DELETE' }),
};
