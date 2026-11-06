import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireAdmin } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import * as controller from './users.controller';
import { updateRoleSchema, userIdParam } from './users.schemas';

/** Mounted at /users (administrators only) */
export const usersRouter = Router();
usersRouter.use(authenticate, requireAdmin);
usersRouter.patch(
  '/:userId/role',
  validate({ params: userIdParam, body: updateRoleSchema }),
  controller.updateRole,
);
