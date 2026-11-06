import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { isProd, isTest } from '../config/env';
import { AppError, ErrorCode } from '../utils/AppError';
import { errorBody } from '../utils/response';

interface Normalized {
  status: number;
  code: ErrorCode;
  message: string;
  details?: unknown;
}

/** Maps any thrown value onto the API's single error shape. */
const normalize = (err: unknown): Normalized => {
  if (err instanceof AppError) {
    return { status: err.status, code: err.code, message: err.message, details: err.details };
  }
  if (err instanceof ZodError) {
    return {
      status: 400,
      code: ErrorCode.VALIDATION,
      message: 'Invalid input',
      details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    };
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return { status: 409, code: ErrorCode.CONFLICT, message: 'A record with these values already exists' };
    }
    if (err.code === 'P2025') {
      return { status: 404, code: ErrorCode.NOT_FOUND, message: 'Resource not found' };
    }
    // Foreign-key violation that a service didn't pre-check.
    if (err.code === 'P2003') {
      return { status: 409, code: ErrorCode.CONFLICT, message: 'Operation conflicts with related records' };
    }
  }
  if ((err as { type?: string } | null)?.type === 'entity.parse.failed') {
    return { status: 400, code: ErrorCode.BAD_REQUEST, message: 'Malformed JSON body' };
  }
  if (!isTest) console.error(err);
  return {
    status: 500,
    code: ErrorCode.INTERNAL,
    message: isProd ? 'Internal server error' : String((err as Error)?.message ?? err),
  };
};

export const notFound = (_req: Request, _res: Response, next: NextFunction) =>
  next(AppError.notFound('Route not found'));

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const { status, code, message, details } = normalize(err);
  res.status(status).json(errorBody(code, message, details));
};
