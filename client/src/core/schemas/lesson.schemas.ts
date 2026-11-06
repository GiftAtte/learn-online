import { z } from 'zod';

/** Validation rules for the lesson form. Messages are what the person sees under the field. */
export const lessonSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Enter at least 3 characters')
    .max(120, 'Use 120 characters or fewer'),
  description: z
    .string()
    .trim()
    .min(1, 'Add a short description')
    .max(2000, 'Use 2,000 characters or fewer'),
  videoUrl: z.url('Add a video: upload a file, paste a link, or enter a YouTube video ID'),
  thumbnailUrl: z
    .union([z.literal(''), z.url('Enter a full web address, starting with https://')])
    .optional(),
  durationSeconds: z
    .number({ error: 'Enter the video length in seconds' })
    .int('Use whole seconds')
    .min(1, 'Enter at least 1 second'),
});
