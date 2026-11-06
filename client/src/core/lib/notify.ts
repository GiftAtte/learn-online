import { toast } from 'sonner';
import { ApiError, getErrorMessage } from '@/core/api/error';
import { MESSAGES } from '@/core/lib/messages';
import type { NotifyOptions } from '@/core/types/notify.types';

/**
 * The only way the app raises a notification. Components never import `toast` directly, so every
 * feedback message looks, sounds and behaves the same.
 *
 *   notify.success(MESSAGES.course.created)
 *   notify.apiError(error)
 */
export const notify = {
  success: (message: string, options?: NotifyOptions) => toast.success(message, options),
  info: (message: string, options?: NotifyOptions) => toast.info(message, options),
  warning: (message: string, options?: NotifyOptions) => toast.warning(message, options),
  error: (message: string, options?: NotifyOptions) =>
    toast.error(message, { duration: 7000, ...options }),

  /** Turns any thrown value into a single, readable error toast. */
  apiError: (error: unknown, fallback?: string) => {
    // A dropped connection and a rejected request deserve the same id so they never pile up.
    const id = error instanceof ApiError && error.isNetwork ? 'network-error' : undefined;
    return toast.error(getErrorMessage(error, fallback ?? MESSAGES.generic.error), {
      duration: 7000,
      id,
    });
  },

  /** Shows a pending toast that resolves to success or error. */
  promise: <T>(
    promise: Promise<T>,
    messages: { loading: string; success: string; error?: string },
  ) =>
    toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: (error: unknown) => getErrorMessage(error, messages.error),
    }),

  dismiss: (id?: string | number) => toast.dismiss(id),
};
