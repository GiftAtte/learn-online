import { z } from 'zod';

/** Validation rules for the category form. Messages are what the person sees under the field. */
export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Enter at least 2 characters')
    .max(50, 'Use 50 characters or fewer'),
});
