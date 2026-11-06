import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError } from '@/core/api/error';
import { notify } from '@/core/lib/notify';

/**
 * Shows server-side validation problems next to the matching fields.
 * Returns true when the error was a validation error that has been displayed on the form;
 * otherwise the caller should show a toast (`notify.apiError`).
 */
const applyServerErrors = <T extends FieldValues>(error: unknown, setError: UseFormSetError<T>) => {
  if (!(error instanceof ApiError) || error.details.length === 0) return false;
  for (const { path, message } of error.details) {
    setError(path as Path<T>, { type: 'server', message });
  }
  return true;
};

/**
 * Standard error handling for a form submit: field problems appear next to their fields,
 * anything else becomes one error toast. Use with mutations declared `meta: { handlesOwnError: true }`.
 */
export const handleSubmitError = <T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
) => {
  if (!applyServerErrors(error, setError)) notify.apiError(error);
};
