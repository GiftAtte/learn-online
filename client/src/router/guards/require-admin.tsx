import { Outlet } from 'react-router-dom';
import { ErrorState } from '@/components/feedback/error-state';
import { ApiError } from '@/core/api/error';
import { useSession } from '@/core/hooks/queries/use-auth';
import { MESSAGES } from '@/core/lib/messages';

/** Admin-only pages. The API enforces this too; this just avoids showing screens that would fail. */
export function RequireAdmin() {
  const { isAdmin } = useSession();
  if (!isAdmin) {
    return <ErrorState error={new ApiError(MESSAGES.generic.forbidden, 403, 'FORBIDDEN')} />;
  }
  return <Outlet />;
}
