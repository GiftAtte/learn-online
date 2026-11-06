import type { Request, Response } from 'express';
import { ok } from '../../utils/response';
import { param, queryOf, requireUser } from '../../utils/request';
import type { AdminLearnersQuery } from './dashboard.schemas';
import * as service from './dashboard.service';

export const learner = async (req: Request, res: Response) => {
  ok(res, await service.learnerDashboard(requireUser(req).id));
};

export const admin = async (_req: Request, res: Response) => {
  ok(res, await service.adminDashboard());
};

export const learners = async (req: Request, res: Response) => {
  const { items, meta } = await service.adminLearners(queryOf<AdminLearnersQuery>(req));
  ok(res, items, meta);
};

export const learnerDetail = async (req: Request, res: Response) => {
  ok(res, await service.adminLearnerDetail(param(req, 'learnerId')));
};
