import { createHash, randomBytes } from 'node:crypto';
import { env } from '../../config/env';
import { prisma } from '../../db/prisma';

const hash = (raw: string) => createHash('sha256').update(raw).digest('hex');
const newRaw = () => randomBytes(32).toString('hex');
const minutes = (n: number) => new Date(Date.now() + n * 60_000);

/* ------------------------------ Password-reset links ------------------------------ */

/** Makes a reset token for the person; any earlier unused one stops working. Returns the raw token to email. */
export const issueResetToken = async (userId: string) => {
  const raw = newRaw();
  await prisma.$transaction([
    prisma.userToken.deleteMany({ where: { userId, type: 'RESET_PASSWORD', usedAt: null } }),
    prisma.userToken.create({
      data: {
        userId,
        type: 'RESET_PASSWORD',
        tokenHash: hash(raw),
        expiresAt: minutes(env.EMAIL_TOKEN_MINUTES),
      },
    }),
  ]);
  return raw;
};

/**
 * Uses up a reset token and returns the person's id, or null when it is unknown, expired or already used.
 * The update is conditional, so two requests cannot both use the same token.
 */
export const consumeResetToken = async (raw: string) => {
  const tokenHash = hash(raw);
  const { count } = await prisma.userToken.updateMany({
    where: { tokenHash, type: 'RESET_PASSWORD', usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });
  if (count === 0) return null;
  return (await prisma.userToken.findUnique({ where: { tokenHash } }))?.userId ?? null;
};

/* ------------------------------ Refresh tokens ------------------------------ */

/** Starts a refresh token for the person. Returns the raw value for the cookie. */
export const issueRefreshToken = async (userId: string) => {
  const raw = newRaw();
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hash(raw),
      expiresAt: minutes(env.REFRESH_TOKEN_DAYS * 24 * 60),
    },
  });
  return raw;
};

export type RefreshResult =
  { status: 'ok'; userId: string } | { status: 'invalid' } | { status: 'reused'; userId: string };

/**
 * Uses a refresh token once. A valid one is marked used (the caller then issues the next one); an unknown or
 * expired one is invalid; one that was already used is `reused`, a sign it was copied, so the caller ends
 * every session of that person.
 */
export const useRefreshToken = async (raw: string): Promise<RefreshResult> => {
  const tokenHash = hash(raw);
  const { count } = await prisma.refreshToken.updateMany({
    where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });
  const token = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!token) return { status: 'invalid' };
  if (count === 1) return { status: 'ok', userId: token.userId };
  return token.usedAt ? { status: 'reused', userId: token.userId } : { status: 'invalid' };
};

/** Ends every refresh token of a person (sign-out, password change or reset, reuse detected). */
export const revokeRefreshTokens = (userId: string) => prisma.refreshToken.deleteMany({ where: { userId } });
