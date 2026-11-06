import { z } from 'zod';
import { pageQuerySchema } from '../../utils/pagination';
import { sortDirSchema } from '../../utils/sorting';

export const courseIdParam = z.object({ courseId: z.uuid() });

// Only http(s) URLs: blocks `javascript:` / `data:` URLs that could be abused when rendered by the client.
const url = z.url({ protocol: /^https?$/ }).max(2048);

const courseFields = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(2000),
  categoryId: z.uuid(),
  thumbnailUrl: url.nullish(),
});

export const createCourseSchema = courseFields.extend({ published: z.boolean().default(false) });

// No defaults here: a partial update must only touch the fields that were sent.
export const updateCourseSchema = courseFields
  .extend({ published: z.boolean() })
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Provide at least one field to update');

export const listCoursesQuery = pageQuerySchema(12).extend({
  q: z.string().trim().max(100).optional(),
  categoryId: z.uuid().optional(),
  /** Administrators only: filter by publication state (learners always see published courses). */
  status: z.enum(['published', 'draft']).optional(),
  sortBy: z.enum(['createdAt', 'title', 'learners', 'lessons']).default('createdAt'),
  sortDir: sortDirSchema,
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type ListCoursesQuery = z.infer<typeof listCoursesQuery>;
