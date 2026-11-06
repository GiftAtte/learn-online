/** Uploading lesson videos and images (course covers, lesson thumbnails). */

/** What a file is for: a lesson video, or an image (a course cover or a lesson thumbnail). */
export type MediaKind = 'video' | 'image';

/** Permission from our API to upload one file straight to Cloudinary (see POST /media/signature). */
export interface UploadSignature {
  uploadUrl: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  allowedFormats: string;
  signature: string;
}

/** A file that now lives in Cloudinary. */
export interface UploadedMedia {
  kind: MediaKind;
  /** The https address to store on the course or lesson. */
  url: string;
  /** Videos only: the length in whole seconds, read by Cloudinary from the file. */
  durationSeconds?: number;
}

/** Options for one upload. */
export interface UploadOptions {
  /** Called with 0 to 100 as the file is sent. */
  onProgress?: (percent: number) => void;
  /** Aborting stops the upload. */
  signal?: AbortSignal;
}
