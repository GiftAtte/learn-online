import type { Request, Response } from 'express';
import { created, noContent, ok } from '../../utils/response';
import { param, queryOf, requireUser } from '../../utils/request';
import type { ListLessonsQuery } from './lessons.schemas';
import * as service from './lessons.service';

export const list = async (req: Request, res: Response) => {
  const { items, meta } = await service.listLessons(queryOf<ListLessonsQuery>(req));
  ok(res, items, meta);
};

export const get = async (req: Request, res: Response) => {
  ok(res, await service.getLessonDetail(param(req, 'lessonId'), requireUser(req)));
};

export const create = async (req: Request, res: Response) => {
  created(res, await service.createLesson(param(req, 'courseId'), req.body));
};

export const update = async (req: Request, res: Response) => {
  ok(res, await service.updateLesson(param(req, 'lessonId'), req.body));
};

export const remove = async (req: Request, res: Response) => {
  await service.deleteLesson(param(req, 'lessonId'));
  noContent(res);
};

export const reorder = async (req: Request, res: Response) => {
  ok(res, await service.reorderLessons(param(req, 'courseId'), req.body.lessonIds));
};
