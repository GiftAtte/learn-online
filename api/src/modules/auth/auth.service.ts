import type { User } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { AppError } from '../../utils/AppError';
import { signToken } from '../../utils/jwt';
import { hashPassword, verifyPassword } from '../../utils/password';
import { sendMail } from '../mail/mailer';
import { resetPasswordMail } from '../mail/templates';
import { getSettings } from '../settings/settings.service';
import {
  consumeResetToken,
  issueRefreshToken,
  issueResetToken,
  revokeRefreshTokens,
  useRefreshToken,
} from './auth.tokens';
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  UpdateProfileInput,
} from './auth.schemas';

export const toPublicUser = (u: User) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  createdAt: u.createdAt,
});

/** A new sign-in: the short-lived access token plus a refresh token that can get the next one. */
const session = async (u: User) => ({
  user: toPublicUser(u),
  token: signToken({ sub: u.id, ver: u.tokenVersion }),
  refreshToken: await issueRefreshToken(u.id),
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
  await revokeRefreshTokens(userId);
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

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(input.newPassword), tokenVersion: { increment: 1 } },
  });
  await revokeRefreshTokens(userId);
  return session(updated);
};

/**
 * Trades a refresh token for a new session (rotation: the old one can never be used again). A token that was
 * already used means it was copied, so every session of that person is ended. Anything else wrong is a plain 401.
 */
export const refresh = async (raw: string) => {
  const result = await useRefreshToken(raw);
  if (result.status === 'reused') {
    await prisma.user.update({ where: { id: result.userId }, data: { tokenVersion: { increment: 1 } } });
    await revokeRefreshTokens(result.userId);
  }
  if (result.status !== 'ok') throw AppError.unauthorized('Your session has ended. Please sign in again.');

  const user = await prisma.user.findUnique({ where: { id: result.userId } });
  if (!user) throw AppError.unauthorized('Account no longer exists');
  return session(user);
};

/**
 * "Forgot password": emails a single-use link if the address belongs to an account. It always answers the
 * same way, so nobody can use it to find out which emails are registered.
 */
export const forgotPassword = async (input: ForgotPasswordInput) => {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) return;
  const token = await issueResetToken(user.id);
  // Not awaited: sending takes a second, and waiting would make known addresses answer slower than unknown
  // ones. sendMail never throws (it logs failures), so there is nothing to catch.
  void sendMail(resetPasswordMail(user.email, user.name, token));
};

/**
 * Sets a new password from an emailed link. The link works once; every existing session is ended (anyone
 * who had the old password is signed out), and the person signs in again with the new one.
 */
export const resetPassword = async (input: ResetPasswordInput) => {
  const userId = await consumeResetToken(input.token);
  if (!userId) {
    throw AppError.badRequest('This reset link is invalid or has expired. Ask for a new one.', [
      { path: 'token', message: 'This reset link is invalid or has expired' },
    ]);
  }
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(input.password), tokenVersion: { increment: 1 } },
  });
  await revokeRefreshTokens(userId);
};
