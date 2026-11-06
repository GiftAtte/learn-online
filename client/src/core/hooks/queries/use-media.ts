import { useMutation } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { validateMediaFile } from '@/core/lib/media';
import * as mediaService from '@/core/services/media.service';
import type { MediaKind, UploadedMedia } from '@/core/types/media.types';

/**
 * Uploads one file of the given kind and tracks it: percent sent, whether it is running, and a
 * way to cancel. The component decides what to do with the result (usually: fill in a form field).
 *
 *   const { upload, progress, isUploading, error, cancel } = useUploadMedia('video');
 *   upload(file, (media) => form.setValue('videoUrl', media.url));
 */
export const useUploadMedia = (kind: MediaKind) => {
  const [progress, setProgress] = useState(0);
  const [rejection, setRejection] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);

  const mutation = useMutation({
    mutationFn: (file: File) => {
      setProgress(0);
      controller.current = new AbortController();
      return mediaService.uploadMedia(file, kind, {
        onProgress: setProgress,
        signal: controller.current.signal,
      });
    },
    meta: { handlesOwnError: true }, // the upload control shows its own message
  });

  return {
    /** Checks the file first; a bad file is explained at once and nothing is sent. */
    upload: (file: File, onUploaded: (media: UploadedMedia) => void) => {
      const problem = validateMediaFile(file, kind);
      setRejection(problem);
      if (problem) return;
      mutation.mutate(file, { onSuccess: (media) => onUploaded(media) });
    },
    cancel: () => controller.current?.abort(),
    progress,
    isUploading: mutation.isPending,
    isDone: mutation.isSuccess,
    /** Why the last file was refused or failed, in words for the person. */
    error:
      rejection ??
      (mutation.error && mutation.error.name !== 'AbortError' ? mutation.error.message : null),
  };
};
