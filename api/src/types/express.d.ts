import type { Viewer } from './viewer';

declare global {
  namespace Express {
    interface Request {
      user?: Viewer;
      /** Populated by validate({ query }) — req.query itself is read-only in Express 5. */
      validatedQuery?: unknown;
    }
  }
}

export {};
