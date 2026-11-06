import type { Request, Response } from 'express';
import { created, noContent, ok } from '../../utils/response';
import { param, queryOf } from '../../utils/request';
import type { ListCoursesQuery } from './courses.schemas';
import * as service from './courses.service';

export const list = async (req: Request, res: Response) => {
  const { items, meta } = await service.listCourses(queryOf<ListCoursesQuery>(req), req.user);
  ok(res, items, meta);
};

export const get = async (req: Request, res: Response) => {
  ok(res, await service.getCourse(param(req, 'courseId'), req.user));
};

export const create = async (req: Request, res: Response) => {
  created(res, await service.createCourse(req.body));
};

export const update = async (req: Request, res: Response) => {
  ok(res, await service.updateCourse(param(req, 'courseId'), req.body));
};

export const remove = async (req: Request, res: Response) => {
  await service.deleteCourse(param(req, 'courseId'));
  noContent(res);
};
