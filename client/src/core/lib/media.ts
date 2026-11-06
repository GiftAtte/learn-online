import type { AppSettings } from '@/core/types/settings.types';
import type { MediaKind } from '@/core/types/media.types';

/** What one kind of file may be: the extensions allowed, and the biggest size in megabytes. */
export interface UploadRules {
  extensions: string[];
  maxMegabytes: number;
}

/** The rules an administrator has set in Settings, for one kind of file. */
export const uploadRulesFor = (settings: AppSettings, kind: MediaKind): UploadRules =>
  kind === 'video'
    ? { extensions: settings.videoFormats, maxMegabytes: settings.videoMaxMegabytes }
    : { extensions: settings.imageFormats, maxMegabytes: settings.imageMaxMegabytes };

/** The value for a file picker's `accept`, so it offers only the allowed types: ".mp4,.webm". */
export const acceptOf = (extensions: string[]) => extensions.map((e) => `.${e}`).join(',');

/**
 * Checks a chosen file BEFORE sending it, so people get an instant explanation instead of waiting
 * for an upload to fail. Returns the message to show, or null when the file is fine.
 */
export const validateMediaFile = (file: File, rules: UploadRules): string | null => {
  const { extensions, maxMegabytes } = rules;
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
