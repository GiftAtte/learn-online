import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSession } from '@/core/hooks/queries/use-auth';

/**
 * The free pages (/catalog, /courses/...) are for visitors who are not signed in. Someone who is
 * signed in is sent to the same page under /learner, which opens inside the app (sidebar).
 */
export function PublicOnly() {
  const { status } = useSession();
  const { pathname, search } = useLocation();

  if (status === 'authenticated') return <Navigate to={`/learner${pathname}${search}`} replace />;
  return <Outlet />;
}
