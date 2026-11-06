import { z } from 'zod';

/** Validation rules for the course form. Messages are what the person sees under the field. */
export const courseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Enter at least 3 characters')
    .max(120, 'Use 120 characters or fewer'),
  categoryId: z.string().min(1, 'Choose a category'),
  description: z
    .string()
    .trim()
    .min(10, 'Describe the course in at least 10 characters')
    .max(2000, 'Use 2,000 characters or fewer'),
  thumbnailUrl: z.union([z.literal(''), z.url('Enter a full web address, starting with https://')]),
  published: z.boolean(),
});
