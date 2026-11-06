import { z } from 'zod';

/** What is being uploaded: a lesson video, or an image (a course cover or a lesson thumbnail). */
export const MEDIA_KINDS = ['video', 'image'] as const;

export const signatureSchema = z.object({
  kind: z.enum(MEDIA_KINDS),
});

export type SignatureInput = z.infer<typeof signatureSchema>;
