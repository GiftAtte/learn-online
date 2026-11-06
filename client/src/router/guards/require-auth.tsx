import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ErrorState } from '@/components/feedback/error-state';
import { PageLoader } from '@/components/feedback/page-loader';
import { useSession } from '@/core/hooks/queries/use-auth';
import { PATHS } from '@/router/paths';

/** Pages that need a signed-in user. Sends guests to sign in and back again afterwards. */
export function RequireAuth() {
  const { status, error, retry } = useSession();
  const location = useLocation();

  if (status === 'loading') return <PageLoader label="Checking your session" />;
  // A temporary failure is not a sign-out: offer to try again instead of showing the sign-in page.
  if (status === 'error') return <ErrorState error={error} onRetry={retry} />;
  if (status === 'guest') return <Navigate to={PATHS.signIn} replace state={{ from: location }} />;
  return <Outlet />;
}
