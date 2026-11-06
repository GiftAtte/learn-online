import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireAdmin } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import * as controller from './dashboard.controller';
import { adminLearnersQuery, courseIdParam, learnerIdParam } from './dashboard.schemas';

export const dashboardRouter = Router();
dashboardRouter.use(authenticate);

dashboardRouter.get('/learner', controller.learner);
dashboardRouter.get('/admin', requireAdmin, controller.admin);
dashboardRouter.get(
  '/admin/learners',
  requireAdmin,
  validate({ query: adminLearnersQuery }),
  controller.learners,
);
dashboardRouter.get(
  '/admin/learners/:learnerId',
  requireAdmin,
  validate({ params: learnerIdParam }),
  controller.learnerDetail,
);
dashboardRouter.get(
  '/admin/courses/:courseId',
  requireAdmin,
  validate({ params: courseIdParam }),
  controller.courseActivity,
);
