import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';

interface Schemas {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

/**
 * Validates request input with zod. Failures throw a ZodError that the central
 * error handler turns into a 400 VALIDATION_ERROR response.
 */
export const validate = (schemas: Schemas) => (req: Request, _res: Response, next: NextFunction) => {
  if (schemas.params) req.params = schemas.params.parse(req.params) as Request['params'];
  if (schemas.query) req.validatedQuery = schemas.query.parse(req.query);
  if (schemas.body) req.body = schemas.body.parse(req.body);
  next();
};
