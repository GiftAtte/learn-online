/** Options for toast notifications (see `core/lib/notify.ts`). */

export interface NotifyOptions {
  /** Secondary line under the message. */
  description?: string;
  /** Milliseconds before it closes. Errors stay a little longer by default. */
  duration?: number;
  /** One id per logical message: repeating it replaces the toast instead of stacking duplicates. */
  id?: string | number;
}
