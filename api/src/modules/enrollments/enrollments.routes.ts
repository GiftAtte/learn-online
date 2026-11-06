import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import * as controller from './enrollments.controller';

/** Mounted at /enrollments */
export const enrollmentsRouter = Router();
enrollmentsRouter.get('/me', authenticate, controller.listMine);

/** Mounted at /courses/:courseId/enroll */
export const courseEnrollRouter = Router({ mergeParams: true });
courseEnrollRouter.use(authenticate);
courseEnrollRouter.post('/', controller.enroll);
courseEnrollRouter.delete('/', controller.unenroll);
