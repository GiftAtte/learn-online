import { ExternalLink, Loader2, Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFieldControl } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { formatClock } from '@/core/lib/format';
import { parseYouTubeId, youTubeIdOf, youTubeThumbnail, youTubeUrl } from '@/core/lib/youtube';
import { fetchYouTubeDuration } from '@/core/lib/youtube-api';

interface YouTubeFieldProps {
  /** The stored address ('' when none). Only the form sees this, never the text typed. */
  value: string;
  /** Called with the canonical YouTube address, or '' when what is typed is not a YouTube video. */
  onChange: (url: string) => void;
  /** Called when a video is recognised, with its length once YouTube has told us (null if it could not). */
  onDetected?: (video: { id: string; durationSeconds: number | null }) => void;
}

/**
 * The "YouTube" way to give a lesson its video: paste the video ID (the 11 characters after v= in the
 * link) or the whole link. It shows YouTube's picture of the video so you can check it is the right
 * one, and asks YouTube for the length so nobody has to type it.
 */
export function YouTubeField({ value, onChange, onDetected }: YouTubeFieldProps) {
  const field = useFieldControl();
  const savedId = youTubeIdOf(value);
  const [text, setText] = useState(savedId ?? '');
  const [looking, setLooking] = useState(false);
  const [length, setLength] = useState<number | null>(null);

  const id = parseYouTubeId(text);
  const invalid = text.trim() !== '' && !id;

  // When a valid video is entered, ask YouTube how long it is (once per video).
  useEffect(() => {
    if (!id) {
      setLength(null);
      return;
    }
    let current = true;
    setLooking(true);
    void fetchYouTubeDuration(id).then((seconds) => {
      if (!current) return;
      setLooking(false);
      setLength(seconds);
      onDetected?.({ id, durationSeconds: seconds });
    });
    return () => {
      current = false;
      setLooking(false);
    };
    // onDetected is a fresh function each render; the video is what should trigger a lookup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div className="flex flex-col gap-3">
      <Input
        icon={Play}
        placeholder="Video ID or link, e.g. dQw4w9WgXcQ"
        value={text}
        spellCheck={false}
        autoComplete="off"
        aria-invalid={invalid || field['aria-invalid'] || undefined}
        onChange={(e) => {
          const next = e.target.value;
          setText(next);
          const nextId = parseYouTubeId(next);
          onChange(nextId ? youTubeUrl(nextId) : '');
        }}
      />

      {invalid && (
        <p role="alert" className="text-sm text-danger">
          That doesn’t look like a YouTube video ID or link. The ID is the 11 characters after{' '}
          <span className="font-medium">v=</span> in the address.
        </p>
      )}

      {id && (
        <div className="flex items-center gap-3 rounded-card border border-line bg-sunken/40 p-2.5">
          <img
            src={youTubeThumbnail(id)}
            alt=""
            className="aspect-video w-32 shrink-0 rounded-control bg-spruce-100 object-cover"
          />
          <div className="flex min-w-0 flex-col gap-0.5 text-sm">
            <p className="font-medium">YouTube video {id}</p>
            <p className="text-ink-faint" aria-live="polite">
              {looking ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  Checking the video length…
                </span>
              ) : length ? (
                `Length ${formatClock(length)}, filled in below`
              ) : (
                'Couldn’t read the length. Enter it below.'
              )}
            </p>
            <a
              href={youTubeUrl(id)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-fit items-center gap-1 text-spruce-700 underline underline-offset-4"
            >
              Open on YouTube
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
