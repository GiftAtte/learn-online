import type { User } from '@prisma/client';
import { prisma } from '../../db/prisma';
import { AppError } from '../../utils/AppError';
import { signToken } from '../../utils/jwt';
import { hashPassword, verifyPassword } from '../../utils/password';
import type { LoginInput, RegisterInput } from './auth.schemas';

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
