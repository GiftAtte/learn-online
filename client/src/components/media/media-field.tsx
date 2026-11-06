import { Link2, Play, RefreshCw, Trash2, UploadCloud, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dropzone } from '@/components/ui/dropzone';
import { useFieldControl } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { ProgressBar } from '@/components/ui/progress';
import { useUploadMedia } from '@/core/hooks/queries/use-media';
import { MEDIA_RULES, videoPosterUrl } from '@/core/lib/media';
import type { MediaKind, UploadedMedia } from '@/core/types/media.types';

interface MediaFieldProps {
  kind: MediaKind;
  /** The address of the current file ('' when there is none). */
  value: string;
  onChange: (url: string) => void;
  /** Anything else to do with a freshly uploaded file, e.g. fill in a video's length. */
  onUploaded?: (media: UploadedMedia) => void;
}

const NOUN: Record<MediaKind, string> = { video: 'video', image: 'image' };

/** "https://x.com/a/my%20file.mp4?x=1" -> "my file.mp4" */
const fileNameOf = (url: string) => {
  try {
    return decodeURIComponent(new URL(url).pathname.split('/').pop() || url);
  } catch {
    return url;
  }
};

/**
 * One input for a video or an image, used inside a <FormField>. It covers the whole life of the file:
 *  - empty: a drop area ("Drop a video here, or browse"), or paste a link instead
 *  - uploading: file name, progress bar and Cancel
 *  - filled: a preview with Replace, Edit link and Remove
 * The form only sees `value` (an address) and `onChange`, so it works with any form library.
 */
export function MediaField({ kind, value, onChange, onUploaded }: MediaFieldProps) {
  const field = useFieldControl();
  const { upload, cancel, progress, isUploading, error } = useUploadMedia(kind);
  const [fileName, setFileName] = useState('');
  const [linkMode, setLinkMode] = useState(false);
  const replacePicker = useRef<HTMLInputElement>(null);
  const rules = MEDIA_RULES[kind];

  const start = (file: File) => {
    setFileName(file.name);
    upload(file, (media) => {
      setLinkMode(false);
      onChange(media.url);
      onUploaded?.(media);
    });
  };

  const rulesText = `${rules.extensions.join(', ').toUpperCase()}, up to ${rules.maxMegabytes} MB`;

  return (
    <div className="flex flex-col gap-2.5">
      {/* The picker behind the Replace button */}
      <input
        ref={replacePicker}
        type="file"
        accept={rules.accept}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) start(file);
        }}
      />
      {isUploading ? (
        <div className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 truncate text-[0.95rem] font-medium">{fileName}</p>
            <Button type="button" variant="ghost" size="sm" onClick={cancel}>
              <X className="size-4" aria-hidden />
              Cancel
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <ProgressBar value={progress} label={`Uploading ${fileName}: ${progress}%`} />
            <span className="w-10 shrink-0 text-right text-sm text-ink-soft tnum">{progress}%</span>
          </div>
        </div>
      ) : linkMode ? (
        <div className="flex flex-col gap-2">
          <Input
            type="url"
            inputMode="url"
            placeholder={kind === 'video' ? 'https://…/lesson.mp4' : 'https://…/picture.jpg'}
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
          <button
            type="button"
            onClick={() => setLinkMode(false)}
            className="inline-flex w-fit cursor-pointer items-center gap-1.5 text-sm font-medium text-spruce-700 underline underline-offset-4"
          >
            <UploadCloud className="size-4" aria-hidden />
            Upload a file instead
          </button>
        </div>
      ) : value ? (
        <div className="flex flex-wrap items-center gap-4 rounded-card border border-line bg-surface p-3">
          <Preview kind={kind} url={value} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.95rem] font-medium" title={value}>
              {fileNameOf(value)}
            </p>
            <p className="text-sm text-ink-faint">
              {value.includes('res.cloudinary.com') ? 'Uploaded' : 'Linked'} {NOUN[kind]}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <Button type="button" variant="secondary" size="sm" onClick={() => setLinkMode(true)}>
              <Link2 className="size-4" aria-hidden />
              Edit link
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => replacePicker.current?.click()}
            >
              <RefreshCw className="size-4" aria-hidden />
              Replace
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')}>
              <Trash2 className="size-4" aria-hidden />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <>
          <Dropzone
            id={field.id}
            aria-describedby={field['aria-describedby']}
            invalid={!!field['aria-invalid']}
            accept={rules.accept}
            onFile={start}
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-spruce-50 text-spruce-600">
              <UploadCloud className="size-5" aria-hidden />
            </span>
            <span className="text-[0.95rem] font-medium">
              Drop a {NOUN[kind]} here, or{' '}
              <span className="underline underline-offset-4">browse</span>
            </span>
            <span className="text-sm text-ink-faint">{rulesText}</span>
          </Dropzone>
          <button
            type="button"
            onClick={() => setLinkMode(true)}
            className="inline-flex w-fit cursor-pointer items-center gap-1.5 text-sm font-medium text-spruce-700 underline underline-offset-4"
          >
            <Link2 className="size-4" aria-hidden />
            Or paste a link
          </button>
        </>
      )}

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** A small picture of the current file: the image itself, or a frame of the video. */
function Preview({ kind, url }: { kind: MediaKind; url: string }) {
  const poster = kind === 'video' ? videoPosterUrl(url) : url;
  return (
    <span className="relative block aspect-video w-28 shrink-0 overflow-hidden rounded-control bg-spruce-100">
      {kind === 'image' || poster ? (
        <img src={poster ?? url} alt="" className="size-full object-cover" />
      ) : (
        <video
          src={`${url}#t=0.5`}
          preload="metadata"
          muted
          playsInline
          className="size-full object-cover"
        />
      )}
      {kind === 'video' && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex size-7 items-center justify-center rounded-full bg-white/90 text-spruce-800">
            <Play className="size-3.5 translate-x-px" fill="currentColor" aria-hidden />
          </span>
        </span>
      )}
    </span>
  );
}
