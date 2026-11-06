import { z } from 'zod';
import { pageQuerySchema } from '../../utils/pagination';
import { sortDirSchema } from '../../utils/sorting';

/** Query for the admin learners table: paging, search by name or email, and sorting. */
export const adminLearnersQuery = pageQuerySchema(10).extend({
  q: z.string().trim().max(100).optional(),
  /** Only learners who have (yes) or haven't (no) enrolled in any course. */
  enrolled: z.enum(['yes', 'no']).optional(),
  sortBy: z.enum(['createdAt', 'name']).default('createdAt'),
  sortDir: sortDirSchema,
});

export type AdminLearnersQuery = z.infer<typeof adminLearnersQuery>;

export const learnerIdParam = z.object({ learnerId: z.uuid() });
