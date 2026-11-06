import type { Request, Response } from 'express';
import { ok } from '../../utils/response';
import * as service from './settings.service';

export const get = async (_req: Request, res: Response) => {
  ok(res, await service.getSettings());
};

export const update = async (req: Request, res: Response) => {
  ok(res, await service.updateSettings(req.body));
};
