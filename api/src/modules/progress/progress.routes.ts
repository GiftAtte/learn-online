import { Router } from 'express';
import { validate } from '../../middleware/validate';
import * as controller from './progress.controller';
import { saveProgressSchema } from './progress.schemas';

/** Mounted at /lessons/:lessonId/progress (authentication is applied by the parent router). */
export const progressRouter = Router({ mergeParams: true });
progressRouter.get('/', controller.get);
progressRouter.put('/', validate({ body: saveProgressSchema }), controller.save);
