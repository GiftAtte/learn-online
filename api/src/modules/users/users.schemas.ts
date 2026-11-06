import { z } from 'zod';

export const userIdParam = z.object({ userId: z.uuid() });

export const updateRoleSchema = z.object({ role: z.enum(['LEARNER', 'ADMIN']) });

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
