import { useEffect } from 'react';
import { useRouteError } from 'react-router-dom';
import { ErrorState } from '@/components/feedback/error-state';
import { PageLoader } from '@/components/feedback/page-loader';
import { isStalePageError, reloadOnce } from '@/core/lib/stale-page';

/**
 * Shown instead of React Router's default "Unexpected Application Error" when a screen crashes.
 * If the cause is an out-of-date page (a new version was deployed), it reloads by itself; otherwise
 * it explains that something went wrong and offers to try again.
 */
export default function RouteErrorPage() {
  const error = useRouteError();
  const stale = isStalePageError(error);

  useEffect(() => {
    if (stale) reloadOnce();
  }, [stale]);

  if (stale) return <PageLoader label="Updating to the latest version" />;
  return <ErrorState error={error} onRetry={() => window.location.reload()} />;
}
