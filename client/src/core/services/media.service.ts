/**
 * Media service: uploading lesson videos and images to Cloudinary.
 * Plain async functions, no React. The hook in `hooks/queries/use-media.ts` wraps `uploadMedia`.
 *
 * How an upload works, in two steps:
 *   1. Ask our API for permission (`getUploadSignature`). Only administrators get it.
 *   2. Send the file straight from the browser to Cloudinary (`uploadMedia`), so big videos never
 *      pass through our server.
 */
import { api } from '@/core/api/client';
import { ApiError } from '@/core/api/error';
import { MESSAGES } from '@/core/lib/messages';
import type {
  MediaKind,
  UploadedMedia,
  UploadOptions,
  UploadSignature,
} from '@/core/types/media.types';

/**
 * Asks for permission to upload one file.
 * POST /media/signature. Administrators only.
 * @param kind "video" or "image"; decides the folder and the file types Cloudinary accepts
 * @throws ApiError 503 when uploads are not set up on the server, 403 when not an administrator
 */
export const getUploadSignature = async (kind: MediaKind) =>
  (await api.post<UploadSignature>('/media/signature', { kind })).data;

/**
 * Uploads one file to Cloudinary and returns where it now lives.
 * This is the single place that knows how to upload; forms never talk to Cloudinary themselves.
 * It uses XMLHttpRequest (not fetch) because only that reports upload progress.
 *
 * @param file the video or image the person chose (check it first with `validateMediaFile`)
 * @param kind "video" or "image"
 * @throws ApiError when the file is rejected or the connection drops; AbortError when cancelled
 */
export const uploadMedia = async (
  file: File,
  kind: MediaKind,
  { onProgress, signal }: UploadOptions = {},
): Promise<UploadedMedia> => {
  const permission = await getUploadSignature(kind);

  // These fields must match exactly what was signed; Cloudinary refuses the upload otherwise.
  const body = new FormData();
  body.append('file', file);
  body.append('api_key', permission.apiKey);
  body.append('timestamp', String(permission.timestamp));
  body.append('folder', permission.folder);
  body.append('allowed_formats', permission.allowedFormats);
  body.append('signature', permission.signature);

  return new Promise<UploadedMedia>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', permission.uploadUrl);

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };

    request.onload = () => {
      const result = parseJson(request.responseText);
      if (request.status >= 200 && request.status < 300 && result?.secure_url) {
        resolve({
          kind,
          url: result.secure_url,
          // Cloudinary reads the length of a video itself (a decimal number of seconds).
          ...(kind === 'video' && typeof result.duration === 'number'
            ? { durationSeconds: Math.max(1, Math.round(result.duration)) }
            : {}),
        });
        return;
      }
      // Cloudinary explains what was wrong ("File size too large", "Invalid file type"...).
      const message = result?.error?.message ?? MESSAGES.generic.error;
      reject(new ApiError(message, request.status, 'UPLOAD_FAILED'));
    };

    request.onerror = () => reject(new ApiError(MESSAGES.generic.network, 0, 'NETWORK'));

    signal?.addEventListener('abort', () => {
      request.abort();
      reject(new DOMException('Upload cancelled', 'AbortError'));
    });

    request.send(body);
  });
};

/** Reads a JSON answer, or null if it is not JSON. */
const parseJson = (text: string) => {
  try {
    return JSON.parse(text) as {
      secure_url?: string;
      duration?: number;
      error?: { message?: string };
    };
  } catch {
    return null;
  }
};
