import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@prisma/client';
import { AppError } from '../utils/AppError';

/**
 * Role-based access control. Must run after `authenticate`.
 * 401 = not signed in, 403 = signed in but the role is not allowed.
 */
const authorize =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw AppError.unauthorized();
    if (!roles.includes(req.user.role)) throw AppError.forbidden();
    next();
  };

export const requireAdmin = authorize('ADMIN');
