import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireAdmin } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import * as controller from './settings.controller';
import { updateSettingsSchema } from './settings.schemas';

/** Mounted at /settings. Reading is public (the name and logo appear before sign-in); changing is admin-only. */
export const settingsRouter = Router();
settingsRouter.get('/', controller.get);
settingsRouter.put(
  '/',
  authenticate,
  requireAdmin,
  validate({ body: updateSettingsSchema }),
  controller.update,
);
