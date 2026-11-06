import { Router } from 'express';
import { authenticate, optionalAuth } from '../../middleware/authenticate';
import { requireAdmin } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { courseEnrollRouter } from '../enrollments/enrollments.routes';
import { courseLessonsRouter } from '../lessons/lessons.routes';
import * as controller from './courses.controller';
import { courseIdParam, createCourseSchema, listCoursesQuery, updateCourseSchema } from './courses.schemas';

export const coursesRouter = Router();

// Public (optionally personalised when a token is sent)
coursesRouter.get('/', optionalAuth, validate({ query: listCoursesQuery }), controller.list);
coursesRouter.get('/:courseId', optionalAuth, validate({ params: courseIdParam }), controller.get);

// Admin only
const adminOnly = [authenticate, requireAdmin];
coursesRouter.post('/', ...adminOnly, validate({ body: createCourseSchema }), controller.create);
coursesRouter.patch(
  '/:courseId',
  ...adminOnly,
  validate({ params: courseIdParam, body: updateCourseSchema }),
  controller.update,
);
coursesRouter.delete('/:courseId', ...adminOnly, validate({ params: courseIdParam }), controller.remove);

// Nested resources
coursesRouter.use('/:courseId/lessons', courseLessonsRouter);
coursesRouter.use('/:courseId/enroll', validate({ params: courseIdParam }), courseEnrollRouter);
