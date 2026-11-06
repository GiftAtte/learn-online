import { UploadCloud, X } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress';
import { useUploadMedia } from '@/core/hooks/queries/use-media';
import { MEDIA_RULES } from '@/core/lib/media';
import type { MediaKind, UploadedMedia } from '@/core/types/media.types';

interface MediaUploadButtonProps {
  kind: MediaKind;
  /** Button text, e.g. "Upload a video". */
  label: string;
  /** Called once the file is in Cloudinary; fill the form's address field with `media.url`. */
  onUploaded: (media: UploadedMedia) => void;
}

/**
 * "Upload a file" next to an address field. Opens the file picker, checks the file, shows the
 * progress while it is sent (with a Cancel button) and reports problems in plain words.
 * It never stores anything itself: the parent form decides what to do with the uploaded address.
 */
export function MediaUploadButton({ kind, label, onUploaded }: MediaUploadButtonProps) {
  const input = useRef<HTMLInputElement>(null);
  const { upload, cancel, progress, isUploading, isDone, error } = useUploadMedia(kind);

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={input}
        type="file"
        accept={MEDIA_RULES[kind].accept}
        className="sr-only"
        tabIndex={-1}
        aria-label={label}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = ''; // so choosing the same file again still triggers a change
          if (file) upload(file, onUploaded);
        }}
      />

      {isUploading ? (
        <div className="flex items-center gap-3">
          <ProgressBar value={progress} label={`${label}: ${progress}% sent`} />
          <span className="w-10 shrink-0 text-sm text-ink-soft tnum">{progress}%</span>
          <Button type="button" variant="ghost" size="sm" onClick={cancel}>
            <X className="size-4" aria-hidden />
            Cancel
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => input.current?.click()}
          >
            <UploadCloud className="size-4" aria-hidden />
            {label}
          </Button>
          <span className="text-sm text-ink-faint">
            {MEDIA_RULES[kind].extensions.join(', ').toUpperCase()}, up to{' '}
            {MEDIA_RULES[kind].maxMegabytes} MB
          </span>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {isDone && !isUploading && !error && (
        <p className="text-sm text-success">Uploaded. The address above is filled in.</p>
      )}
    </div>
  );
}
