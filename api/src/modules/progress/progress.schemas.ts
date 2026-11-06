import { z } from 'zod';

export const saveProgressSchema = z.object({
  positionSeconds: z
    .number()
    .min(0)
    .max(60 * 60 * 12),
  /** Sent by the player when the video `ended` event fires. */
  completed: z.boolean().optional(),
});

export type SaveProgressInput = z.infer<typeof saveProgressSchema>;
