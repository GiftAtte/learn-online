import { MutationCache, QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/core/api/error';
import { notify } from '@/core/lib/notify';

/**
 * Shared data-fetching defaults.
 *  - Failed mutations (create, update, delete...) always raise one standard error toast, so
 *    individual screens only handle the success path.
 *  - Queries are not retried for 4xx answers: retrying "not found" or "forbidden" never helps.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status >= 400 && error.status < 500) &&
        failureCount < 2,
    },
  },
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      // Mutations that handle their own errors (e.g. form field errors) opt out via meta.
      if (mutation.meta?.handlesOwnError) return;
      notify.apiError(error);
    },
  }),
});
