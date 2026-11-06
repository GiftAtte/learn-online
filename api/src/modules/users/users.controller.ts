import type { Request, Response } from 'express';
import { param, requireUser } from '../../utils/request';
import { ok } from '../../utils/response';
import * as service from './users.service';

export const updateRole = async (req: Request, res: Response) => {
  ok(res, await service.updateRole(param(req, 'userId'), requireUser(req), req.body));
};
