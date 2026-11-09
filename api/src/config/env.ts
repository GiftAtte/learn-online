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
  // Cloudinary stores uploaded videos and images. All three are needed for uploads; without them the
  // upload buttons explain that uploads are not set up, and links to files still work.
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  // Sign-in and sign-up attempts allowed per address in 15 minutes (slows down password guessing).
  // Leave it at 20 in real use; only the browser tests, which sign in many times, raise it.
  AUTH_RATE_LIMIT: z.coerce.number().int().positive().default(20),
  // Failed sign-in (or password-change) attempts allowed per address, and how long before the count starts
  // again. After this many wrong passwords the address is blocked until the time has passed.
  AUTH_MAX_FAILED_ATTEMPTS: z.coerce.number().int().positive().default(5),
  AUTH_LOCKOUT_MINUTES: z.coerce.number().int().positive().default(15),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:', z.prettifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
