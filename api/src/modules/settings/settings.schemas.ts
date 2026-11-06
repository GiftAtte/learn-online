import { z } from 'zod';

// Only http(s) URLs: blocks `javascript:` / `data:` URLs that could be abused when rendered by the client.
const url = z.url({ protocol: /^https?$/ }).max(2048);

/** An optional text: blank becomes null, which clears the saved value. */
const optional = <T extends z.ZodType<string>>(schema: T) =>
  z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? null : v), schema.nullish());

/** The file types an administrator can allow for each kind of upload (what Cloudinary and browsers handle well). */
export const IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'] as const;
export const VIDEO_FORMATS = ['mp4', 'webm', 'mov', 'm4v', 'ogv'] as const;

/** Cloudinary's free plan stops at 100 MB per video; paid plans allow more. */
export const MAX_IMAGE_MEGABYTES = 50;
export const MAX_VIDEO_MEGABYTES = 1000;

export const updateSettingsSchema = z.object({
  appName: z.string().trim().min(2).max(40),
  tagline: optional(z.string().trim().max(120)),
  logoUrl: optional(url),
  supportEmail: optional(z.email().max(120)),
  imageMaxMegabytes: z.number().int().min(1).max(MAX_IMAGE_MEGABYTES),
  videoMaxMegabytes: z.number().int().min(1).max(MAX_VIDEO_MEGABYTES),
  imageFormats: z.array(z.enum(IMAGE_FORMATS)).min(1),
  videoFormats: z.array(z.enum(VIDEO_FORMATS)).min(1),
  allowSignups: z.boolean(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
