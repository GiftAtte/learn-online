import { prisma } from '../../db/prisma';
import type { Viewer } from '../../types/viewer';
import { AppError } from '../../utils/AppError';
import { toPublicUser } from '../auth/auth.service';
import type { UpdateRoleInput } from './users.schemas';

/**
 * Promote a learner to administrator, or demote an administrator.
 * Administrators cannot change their own role, so the platform can never be left without one.
 */
export const updateRole = async (userId: string, viewer: Viewer, input: UpdateRoleInput) => {
  if (userId === viewer.id) throw AppError.forbidden('You cannot change your own role');
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) throw AppError.notFound('User not found');
  return toPublicUser(await prisma.user.update({ where: { id: userId }, data: { role: input.role } }));
};
