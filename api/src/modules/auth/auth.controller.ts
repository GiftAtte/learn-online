import type { Request, Response } from 'express';
import {
  clearRefreshCookie,
  clearSessionCookie,
  readRefreshCookie,
  setRefreshCookie,
  setSessionCookie,
} from '../../utils/cookie';
import { AppError } from '../../utils/AppError';
import { created, noContent, ok } from '../../utils/response';
import { requireUser } from '../../utils/request';
import * as service from './auth.service';

/** Both halves of a session go into httpOnly cookies. */
const startSession = (res: Response, token: string, refreshToken: string) => {
  setSessionCookie(res, token);
  setRefreshCookie(res, refreshToken);
};

/** The tokens go into httpOnly cookies; the response body only carries the user. */
export const register = async (req: Request, res: Response) => {
  const { user, token, refreshToken } = await service.register(req.body);
  startSession(res, token, refreshToken);
  created(res, { user });
};

export const login = async (req: Request, res: Response) => {
  const { user, token, refreshToken } = await service.login(req.body);
  startSession(res, token, refreshToken);
  ok(res, { user });
};

export const me = async (req: Request, res: Response) => {
  ok(res, await service.getMe(requireUser(req).id));
};

/** Revokes the tokens on the server and removes the cookie from the browser. */
export const logout = async (req: Request, res: Response) => {
  await service.logout(requireUser(req).id);
  clearSessionCookie(res);
  clearRefreshCookie(res);
  noContent(res);
};

export const updateProfile = async (req: Request, res: Response) => {
  ok(res, await service.updateProfile(requireUser(req).id, req.body));
};

/** Keeps this browser signed in with a new token; every other session is signed out. */
export const changePassword = async (req: Request, res: Response) => {
  const { token, refreshToken } = await service.changePassword(requireUser(req).id, req.body);
  startSession(res, token, refreshToken);
  noContent(res);
};

/** Quietly renews the session from the refresh cookie. A bad or reused one clears both cookies and answers 401. */
export const refresh = async (req: Request, res: Response) => {
  const raw = readRefreshCookie(req);
  if (!raw) throw AppError.unauthorized();
  try {
    const { user, token, refreshToken } = await service.refresh(raw);
    startSession(res, token, refreshToken);
    ok(res, { user });
  } catch (error) {
    clearSessionCookie(res);
    clearRefreshCookie(res);
    throw error;
  }
};

/** Always 204, whether or not the address has an account. */
export const forgotPassword = async (req: Request, res: Response) => {
  await service.forgotPassword(req.body);
  noContent(res);
};

export const resetPassword = async (req: Request, res: Response) => {
  await service.resetPassword(req.body);
  clearSessionCookie(res);
  clearRefreshCookie(res);
  noContent(res);
};
