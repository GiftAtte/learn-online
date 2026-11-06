import type { CookieOptions, Request, Response } from 'express';
import { isProd } from '../config/env';

/** Name of the cookie that carries the sign-in token. */
export const SESSION_COOKIE = 'session';

/**
 * Why the cookie is set up this way:
 *  - httpOnly: JavaScript cannot read it, so an XSS bug cannot steal the token.
 *  - sameSite strict: the browser only sends it on requests made from our own site (stops CSRF).
 *  - secure (production): only sent over HTTPS. Browsers also allow it on http://localhost.
 *  - path: only sent to the API, never to the page or static files.
 *  - no maxAge: it is dropped when the browser closes; the token inside expires on its own anyway.
 */
const options: CookieOptions = {
  httpOnly: true,
  sameSite: 'strict',
  secure: isProd,
  path: '/api/v1',
};

/** Stores the token in the browser as an httpOnly cookie. */
export const setSessionCookie = (res: Response, token: string) => {
  res.cookie(SESSION_COOKIE, token, options);
};

/** Tells the browser to delete the cookie (it must use the same path as when it was set). */
export const clearSessionCookie = (res: Response) => {
  res.clearCookie(SESSION_COOKIE, options);
};

/** Reads the token from the request's cookies, or null when the person is not signed in. */
export const readSessionCookie = (req: Request): string | null => req.cookies?.[SESSION_COOKIE] ?? null;
