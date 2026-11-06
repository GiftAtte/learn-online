import type { MediaKind } from '@/core/types/media.types';

/** What each kind of file may be: the types the file picker offers, and the biggest size we accept. */
export const MEDIA_RULES: Record<
  MediaKind,
  { accept: string; extensions: string[]; maxMegabytes: number }
> = {
  // 100 MB is the largest video Cloudinary's free plan accepts.
  video: {
    accept: 'video/mp4,video/webm,video/quicktime',
    extensions: ['mp4', 'webm', 'mov'],
    maxMegabytes: 100,
  },
  image: {
    accept: 'image/jpeg,image/png,image/webp,image/gif',
    extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    maxMegabytes: 10,
  },
};

/**
 * Checks a chosen file BEFORE sending it, so people get an instant explanation instead of waiting
 * for an upload to fail. Returns the message to show, or null when the file is fine.
 */
export const validateMediaFile = (file: File, kind: MediaKind): string | null => {
  const { extensions, maxMegabytes } = MEDIA_RULES[kind];
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';

  if (!extensions.includes(extension)) {
    return `Choose a ${extensions.join(', ').toUpperCase()} file.`;
  }
  if (file.size > maxMegabytes * 1024 * 1024) {
    return `That file is too big. The limit is ${maxMegabytes} MB.`;
  }
  return null;
};

/**
 * A picture taken from a video, for use as its thumbnail. Cloudinary makes it on the fly: ask for the
 * same address with a picture transformation (one second in, 16:9) and a .jpg ending.
 * Returns null for addresses that are not Cloudinary videos.
 */
export const videoPosterUrl = (videoUrl: string): string | null => {
  if (!videoUrl.includes('res.cloudinary.com') || !videoUrl.includes('/video/upload/')) return null;
  return videoUrl
    .replace('/video/upload/', '/video/upload/so_1,w_640,h_360,c_fill,q_auto/')
    .replace(/\.[a-z0-9]+$/i, '.jpg');
};
