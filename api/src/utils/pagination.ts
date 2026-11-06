import { z } from 'zod';
import type { PageMeta } from './response';

/** Reusable zod schema for ?page=&pageSize= query strings. */
export const pageQuerySchema = (defaultPageSize = 12, maxPageSize = 50) =>
  z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(maxPageSize).default(defaultPageSize),
  });

export interface PageInput {
  page: number;
  pageSize: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}

/** Prisma `skip`/`take` for a page. */
export const pageArgs = ({ page, pageSize }: PageInput) => ({
  skip: (page - 1) * pageSize,
  take: pageSize,
});

export const paginated = <T>(items: T[], { page, pageSize }: PageInput, total: number): Paginated<T> => ({
  items,
  meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
});
