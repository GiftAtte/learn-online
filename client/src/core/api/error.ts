import { MESSAGES } from '@/core/lib/messages';

/** Every failed API call surfaces as an ApiError, whatever the cause. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    /** Field-level problems from server-side validation. */
    public readonly details: { path: string; message: string }[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isUnauthorized() {
    return this.status === 401;
  }
  get isForbidden() {
    return this.status === 403;
  }
  get isNotFound() {
    return this.status === 404;
  }
  get isNetwork() {
    return this.status === 0;
  }
}

/** The one place that turns any thrown value into text a person can read. */
export const getErrorMessage = (error: unknown, fallback: string = MESSAGES.generic.error) => {
  if (error instanceof ApiError) return error.message;
  return fallback;
};
