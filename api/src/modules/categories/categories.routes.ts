import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireAdmin } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import * as controller from './categories.controller';
import { categoryIdParam, createCategorySchema, updateCategorySchema } from './categories.schemas';

export const categoriesRouter = Router();

categoriesRouter.get('/', controller.list);

const adminOnly = [authenticate, requireAdmin];
categoriesRouter.post('/', ...adminOnly, validate({ body: createCategorySchema }), controller.create);
categoriesRouter.patch(
  '/:categoryId',
  ...adminOnly,
  validate({ params: categoryIdParam, body: updateCategorySchema }),
  controller.update,
);
categoriesRouter.delete(
  '/:categoryId',
  ...adminOnly,
  validate({ params: categoryIdParam }),
  controller.remove,
);
