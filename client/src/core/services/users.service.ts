/**
 * Users service: the API call for managing who is an administrator.
 * Plain async function, no React. The hook in `hooks/queries/use-users.ts` wraps it.
 */
import { api } from '@/core/api/client';
import type { Role } from '@/core/types/user.types';

/**
 * Promotes a learner to administrator, or demotes an administrator to learner.
 * PATCH /users/:id/role. Administrators only.
 * @param userId the person whose role changes
 * @throws ApiError 403 when changing your own role (so there is always at least one administrator),
 *         404 when there is no such user
 */
export const updateUserRole = (userId: string, role: Role) =>
  api.patch(`/users/${userId}/role`, { role });
