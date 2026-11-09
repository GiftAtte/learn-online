import type { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { isTest } from '../config/env';
import { ErrorCode } from '../utils/AppError';
import { errorBody } from '../utils/response';

interface LimiterOptions {
  /** Count only requests that fail (status 400 or higher). Successful requests never use up the allowance. */
  failuresOnly?: boolean;
  /** Words for the 429 answer. The wait ("Try again in 12 minutes.") is added for you. */
  message?: string;
  /** Tests switch limits off so suites can make many requests; a test of the limiter itself turns them on. */
  enforceInTests?: boolean;
}

const minutesUntil = (resetTime?: Date) =>
  Math.max(1, Math.ceil(((resetTime?.getTime() ?? Date.now()) - Date.now()) / 60_000));

/**
 * Per-IP rate limiter that answers with the API's standard error shape and says how long to wait.
 * Counters are kept in memory (per process); use a shared store such as Redis if you run several instances.
 * Disabled in tests so suites can make many requests.
 */
export const createLimiter = (limit: number, windowMs = 15 * 60 * 1000, options: LimiterOptions = {}) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.failuresOnly ?? false,
    skip: () => isTest && !options.enforceInTests,
    handler: (req: Request, res: Response) => {
      // express-rate-limit adds the counter to the request; its type is not part of Express.
      const wait = minutesUntil((req as Request & { rateLimit?: { resetTime?: Date } }).rateLimit?.resetTime);
      const base = options.message ?? 'Too many requests, please try again later';
      const message = options.message
        ? `${base} Try again in ${wait} ${wait === 1 ? 'minute' : 'minutes'}.`
        : base;
      res.status(429).json(errorBody(ErrorCode.RATE_LIMITED, message));
    },
  });
