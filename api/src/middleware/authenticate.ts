import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../db/prisma';
import type { Viewer } from '../types/viewer';
import { AppError } from '../utils/AppError';
import { readSessionCookie } from '../utils/cookie';
import { verifyToken } from '../utils/jwt';

/**
 * Verifies the token, then loads the user so the role is always current and deleted accounts are
 * rejected right away. Returns null for any invalid token or missing user.
 */
const resolveViewer = async (token: string): Promise<Viewer | null> => {
  try {
    const { sub, ver } = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: sub },
      select: { id: true, role: true, tokenVersion: true },
    });
    // A bumped tokenVersion (sign-out) revokes every token issued before it.
    return user && user.tokenVersion === ver ? { id: user.id, role: user.role } : null;
  } catch {
    return null; // bad signature, expired, malformed...
  }
};

/** Requires a valid session cookie for an existing user. */
export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  const token = readSessionCookie(req);
  if (!token) throw AppError.unauthorized();

  const viewer = await resolveViewer(token);
  if (!viewer) throw AppError.unauthorized('Invalid or expired token');

  req.user = viewer;
  next();
};

/**
 * Attaches req.user when a valid token is present, but never rejects.
 * Used on public routes (e.g. the catalog) that show extra, personalised data to signed-in users.
 */
export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  const token = readSessionCookie(req);
  const viewer = token ? await resolveViewer(token) : null;
  if (viewer) req.user = viewer;
  next();
};
