import rateLimit from 'express-rate-limit';
import { isTest } from '../config/env';
import { ErrorCode } from '../utils/AppError';
import { errorBody } from '../utils/response';

/**
 * Per-IP rate limiter that answers with the API's standard error shape.
 * Counters are kept in memory (per process); use a shared store such as Redis if you run several instances.
 * Disabled in tests so suites can make many requests.
 */
export const createLimiter = (limit: number, windowMs = 15 * 60 * 1000) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => isTest,
    message: errorBody(ErrorCode.RATE_LIMITED, 'Too many requests, please try again later'),
  });
