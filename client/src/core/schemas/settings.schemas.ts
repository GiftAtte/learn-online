import { z } from 'zod';
import {
  IMAGE_FORMAT_CHOICES,
  MAX_IMAGE_MEGABYTES,
  MAX_VIDEO_MEGABYTES,
  VIDEO_FORMAT_CHOICES,
} from '@/core/types/settings.types';

/** A whole number of megabytes between 1 and `max` (the form reads number inputs as numbers). */
const megabytes = (max: number) =>
  z
    .number({ error: 'Enter a number' })
    .int('Use a whole number')
    .min(1, 'Use at least 1 MB')
    .max(max, `Use ${max} MB or less`);

/** Validation rules for the settings form. Messages are what the person sees under the field. */
export const settingsSchema = z.object({
  appName: z
    .string()
    .trim()
    .min(2, 'Enter at least 2 characters')
    .max(40, 'Use 40 characters or fewer'),
  tagline: z.string().trim().max(120, 'Use 120 characters or fewer'),
  logoUrl: z.union([z.literal(''), z.url('Enter a full web address, starting with https://')]),
  supportEmail: z.union([z.literal(''), z.email('Enter a valid email address')]),
  imageMaxMegabytes: megabytes(MAX_IMAGE_MEGABYTES),
  videoMaxMegabytes: megabytes(MAX_VIDEO_MEGABYTES),
  imageFormats: z.array(z.enum(IMAGE_FORMAT_CHOICES)).min(1, 'Allow at least one file type'),
  videoFormats: z.array(z.enum(VIDEO_FORMAT_CHOICES)).min(1, 'Allow at least one file type'),
  allowSignups: z.boolean(),
});
