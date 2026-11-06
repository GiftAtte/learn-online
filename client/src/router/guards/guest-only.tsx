import { Navigate, Outlet } from 'react-router-dom';
import { ErrorState } from '@/components/feedback/error-state';
import { PageLoader } from '@/components/feedback/page-loader';
import { useSession } from '@/core/hooks/queries/use-auth';
import { PATHS } from '@/router/paths';

/** Sign-in / sign-up: signed-in people are sent home instead. */
export function GuestOnly() {
  const { status, error, retry } = useSession();
  if (status === 'loading') return <PageLoader />;
  if (status === 'error') return <ErrorState error={error} onRetry={retry} />;
  if (status === 'authenticated') return <Navigate to={PATHS.learner.catalog} replace />;
  return <Outlet />;
}
