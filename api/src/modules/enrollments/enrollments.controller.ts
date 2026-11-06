import type { Request, Response } from 'express';
import { created, noContent, ok } from '../../utils/response';
import { param, requireUser } from '../../utils/request';
import * as service from './enrollments.service';

export const listMine = async (req: Request, res: Response) => {
  ok(res, await service.listMine(requireUser(req).id));
};

export const enroll = async (req: Request, res: Response) => {
  const result = await service.enroll(requireUser(req).id, param(req, 'courseId'));
  // 201 for a new enrollment, 200 when the learner was already enrolled (idempotent).
  (result.created ? created : ok)(res, result.enrollment);
};

export const unenroll = async (req: Request, res: Response) => {
  await service.unenroll(requireUser(req).id, param(req, 'courseId'));
  noContent(res);
};
