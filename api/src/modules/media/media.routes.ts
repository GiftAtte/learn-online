import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireAdmin } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import * as controller from './media.controller';
import { signatureSchema } from './media.schemas';

/** Mounted at /media (administrators only): only they add courses and lessons, so only they upload. */
export const mediaRouter = Router();
mediaRouter.use(authenticate, requireAdmin);
mediaRouter.post('/signature', validate({ body: signatureSchema }), controller.createSignature);
