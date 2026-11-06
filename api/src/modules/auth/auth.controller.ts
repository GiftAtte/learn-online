import type { Request, Response } from 'express';
import { clearSessionCookie, setSessionCookie } from '../../utils/cookie';
import { created, noContent, ok } from '../../utils/response';
import { requireUser } from '../../utils/request';
import * as service from './auth.service';

/** The token goes into an httpOnly cookie; the response body only carries the user. */
export const register = async (req: Request, res: Response) => {
  const { user, token } = await service.register(req.body);
  setSessionCookie(res, token);
  created(res, { user });
};

export const login = async (req: Request, res: Response) => {
  const { user, token } = await service.login(req.body);
  setSessionCookie(res, token);
  ok(res, { user });
};

export const me = async (req: Request, res: Response) => {
  ok(res, await service.getMe(requireUser(req).id));
};

/** Revokes the tokens on the server and removes the cookie from the browser. */
export const logout = async (req: Request, res: Response) => {
  await service.logout(requireUser(req).id);
  clearSessionCookie(res);
  noContent(res);
};
