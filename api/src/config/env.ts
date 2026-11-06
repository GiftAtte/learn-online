import 'dotenv/config';
import { z } from 'zod';

/**
 * Environment configuration, validated once at startup.
 * The app refuses to boot with a missing/weak config rather than failing later at runtime.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),

  // A short secret makes tokens brute-forceable, so enforce a minimum length.
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('1h'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  // Number of reverse proxies in front of the API (0 = none). Needed so rate limiting sees real client IPs.
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:', z.prettifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
