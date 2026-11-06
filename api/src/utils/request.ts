import type { Request } from 'express';
import type { Viewer } from '../types/viewer';
import { AppError } from './AppError';

/** Reads a (validated) route param. */
export const param = (req: Request, name: string) => req.params[name] as string;

/** Returns the query parsed by `validate({ query })`. */
export const queryOf = <T>(req: Request) => (req.validatedQuery ?? {}) as T;

/** The authenticated user; only call behind `authenticate`. */
export const requireUser = (req: Request): Viewer => {
  if (!req.user) throw AppError.unauthorized();
  return req.user;
};
