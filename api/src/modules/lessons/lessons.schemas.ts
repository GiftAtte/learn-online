import { z } from 'zod';

export const lessonIdParam = z.object({ lessonId: z.uuid() });

// Only http(s) URLs: blocks `javascript:` / `data:` URLs that could be abused when rendered by the client.
const videoUrl = z.url({ protocol: /^https?$/ }).max(2048);

export const createLessonSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(1).max(2000),
  videoUrl,
  /** Optional picture for the lesson card; null removes it. */
  thumbnailUrl: z
    .url({ protocol: /^https?$/ })
    .max(2048)
    .nullish(),
  durationSeconds: z
    .number()
    .int()
    .min(1)
    .max(60 * 60 * 12),
  /** Optional; defaults to the end of the course. */
  order: z.number().int().min(1).max(10_000).optional(),
});

export const updateLessonSchema = createLessonSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Provide at least one field to update');

export const reorderSchema = z.object({
  lessonIds: z.array(z.uuid()).min(1).max(500),
});

export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
