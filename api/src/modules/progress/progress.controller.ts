import type { Request, Response } from 'express';
import { ok } from '../../utils/response';
import { param, requireUser } from '../../utils/request';
import * as service from './progress.service';

export const get = async (req: Request, res: Response) => {
  ok(res, await service.getProgress(param(req, 'lessonId'), requireUser(req)));
};

export const save = async (req: Request, res: Response) => {
  ok(res, await service.saveProgress(param(req, 'lessonId'), requireUser(req), req.body));
};
