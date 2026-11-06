import type { Request, Response } from 'express';
import { created, noContent, ok } from '../../utils/response';
import { param } from '../../utils/request';
import * as service from './categories.service';

export const list = async (_req: Request, res: Response) => {
  ok(res, await service.listCategories());
};

export const create = async (req: Request, res: Response) => {
  created(res, await service.createCategory(req.body));
};

export const update = async (req: Request, res: Response) => {
  ok(res, await service.updateCategory(param(req, 'categoryId'), req.body));
};

export const remove = async (req: Request, res: Response) => {
  await service.deleteCategory(param(req, 'categoryId'));
  noContent(res);
};
