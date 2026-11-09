import type { User } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { AppError } from '../../utils/AppError';
import { signToken } from '../../utils/jwt';
import { hashPassword, verifyPassword } from '../../utils/password';
import { getSettings } from '../settings/settings.service';
import type { ChangePasswordInput, LoginInput, RegisterInput, UpdateProfileInput } from './auth.schemas';

export const toPublicUser = (u: User) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  createdAt: u.createdAt,
});

const session = (u: User) => ({
  user: toPublicUser(u),
  token: signToken({ sub: u.id, ver: u.tokenVersion }),
});

export const register = async (input: RegisterInput) => {
  if (!(await getSettings()).allowSignups) {
    throw AppError.forbidden('New sign-ups are closed. Ask an administrator for an account.');
  }
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw AppError.conflict('An account with this email already exists');
  // Role is never taken from client input: public sign-up always creates learners.
  const user = await prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash: await hashPassword(input.password) },
  });
  return session(user);
};

// Unknown emails are still compared against a dummy hash so login takes about the same time either
// way; otherwise response timing would reveal which emails are registered. Computed lazily, once.
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= hashPassword('not-a-real-password-1'));

export const login = async (input: LoginInput) => {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  const ok = await verifyPassword(input.password, user?.passwordHash ?? (await getDummyHash()));
  if (!user || !ok) throw AppError.unauthorized('Invalid email or password');
  return session(user);
};

export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw AppError.unauthorized('Account no longer exists');
  return toPublicUser(user);
};

/** Sign out everywhere: tokens issued so far stop working immediately. */
export const logout = async (userId: string) => {
  await prisma.user.update({ where: { id: userId }, data: { tokenVersion: { increment: 1 } } });
};

/** Change your own name. */
export const updateProfile = async (userId: string, input: UpdateProfileInput) =>
  toPublicUser(await prisma.user.update({ where: { id: userId }, data: { name: input.name } }));

/**
 * Change your own password. The current one must be right. Every token issued so far stops working
 * (so a stolen session is cut off), and a fresh one is returned to keep the person signed in here.
 * A wrong current password is a 400 on that field, not a 401, so the app does not treat it as a
 * signed-out session.
 */
export const changePassword = async (userId: string, input: ChangePasswordInput) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw AppError.unauthorized('Account no longer exists');

  if (!(await verifyPassword(input.currentPassword, user.passwordHash))) {
    throw AppError.badRequest('Your current password is not right', [
      { path: 'currentPassword', message: 'That is not your current password' },
    ]);
  }
  if (input.currentPassword === input.newPassword) {
    throw AppError.badRequest('Choose a different password', [
      { path: 'newPassword', message: 'Choose a password you have not used just now' },
    ]);
  }

  return session(
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(input.newPassword), tokenVersion: { increment: 1 } },
    }),
  );
};
