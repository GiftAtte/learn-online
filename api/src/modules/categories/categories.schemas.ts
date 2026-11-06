import { z } from 'zod';

export const categoryIdParam = z.object({ categoryId: z.uuid() });

export const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(50),
});

export const updateCategorySchema = createCategorySchema;

export type CategoryInput = z.infer<typeof createCategorySchema>;
