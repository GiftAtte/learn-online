import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireAdmin } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { progressRouter } from '../progress/progress.routes';
import * as controller from './lessons.controller';
import { courseIdParam } from '../courses/courses.schemas';
import { createLessonSchema, lessonIdParam, reorderSchema, updateLessonSchema } from './lessons.schemas';

/** Mounted at /courses/:courseId/lessons */
export const courseLessonsRouter = Router({ mergeParams: true });
courseLessonsRouter.use(authenticate, requireAdmin, validate({ params: courseIdParam }));
courseLessonsRouter.post('/', validate({ body: createLessonSchema }), controller.create);
courseLessonsRouter.put('/reorder', validate({ body: reorderSchema }), controller.reorder);

/** Mounted at /lessons */
export const lessonsRouter = Router();
lessonsRouter.use(authenticate);
lessonsRouter.get('/:lessonId', validate({ params: lessonIdParam }), controller.get);
lessonsRouter.patch(
  '/:lessonId',
  requireAdmin,
  validate({ params: lessonIdParam, body: updateLessonSchema }),
  controller.update,
);
lessonsRouter.delete('/:lessonId', requireAdmin, validate({ params: lessonIdParam }), controller.remove);
lessonsRouter.use('/:lessonId/progress', progressRouter);
