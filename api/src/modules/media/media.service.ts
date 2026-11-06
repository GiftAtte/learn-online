import { createHash } from 'node:crypto';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import { getSettings } from '../settings/settings.service';
import type { SignatureInput } from './media.schemas';

/**
 * Media uploads go straight from the browser to Cloudinary, so large videos never pass through
 * this server. All this API does is decide WHO may upload and WHAT: it signs the upload request.
 * Cloudinary rejects any upload whose settings do not match the signature, so a visitor cannot
 * change the folder or the allowed file types.
 */

/** Where each kind of file is stored in Cloudinary. The formats it accepts are an administrator setting. */
const RULES = {
  video: { folder: 'learnonline/videos' },
  image: { folder: 'learnonline/images' },
} as const;

/**
 * Cloudinary's signature: sort the settings by name, join them as `name=value&name=value`, add the
 * API secret at the end and take the SHA-1 of the result. Exported so tests can check it.
 */
export const signParams = (params: Record<string, string | number>, apiSecret: string) => {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return createHash('sha1')
    .update(toSign + apiSecret)
    .digest('hex');
};

/** Everything the browser needs to upload one file straight to Cloudinary. */
export const createUploadSignature = async ({ kind }: SignatureInput) => {
  const {
    CLOUDINARY_CLOUD_NAME: cloudName,
    CLOUDINARY_API_KEY: apiKey,
    CLOUDINARY_API_SECRET: apiSecret,
  } = env;
  if (!cloudName || !apiKey || !apiSecret) {
    throw AppError.unavailable('File uploads are not set up yet. Paste a link to the file instead.');
  }

  const { folder } = RULES[kind];
  const settings = await getSettings();
  const allowedFormats = (kind === 'video' ? settings.videoFormats : settings.imageFormats).join(',');
  const maxMegabytes = kind === 'video' ? settings.videoMaxMegabytes : settings.imageMaxMegabytes;
  const timestamp = Math.floor(Date.now() / 1000);
  // These are exactly the settings the browser must send back; changing any of them breaks the signature.
  const signature = signParams({ allowed_formats: allowedFormats, folder, timestamp }, apiSecret);

  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${kind}/upload`,
    cloudName,
    apiKey,
    timestamp,
    folder,
    allowedFormats,
    maxMegabytes,
    signature,
  };
};
