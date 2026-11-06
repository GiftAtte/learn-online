/** The envelope every API response is wrapped in (see api/README.md). */

/** Paging details sent with list responses. */
export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** A successful response: `data`, plus `meta` on paged lists. */
export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: PageMeta;
}

/** A failed response: a machine-readable `code`, a message and optional per-field details. */
export interface ApiFailure {
  success: false;
  error: { code: string; message: string; details?: { path: string; message: string }[] };
}

/** What `api.get/post/...` resolve to once the envelope has been unwrapped. */
export interface ApiResult<T> {
  data: T;
  meta?: PageMeta;
}

/** HTTP verbs the API client sends. */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Everything the API client needs to make one request. */
export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  /** Query-string values; empty ones are left out. */
  query?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
}

/** The options the `api.get` helper accepts. */
export type RequestParams = Pick<RequestOptions, 'query' | 'signal'>;
