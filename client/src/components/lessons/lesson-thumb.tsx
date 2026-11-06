import { Check, Lock, Play } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/core/lib/cn';
import { formatDuration } from '@/core/lib/format';

interface LessonThumbProps {
  /** The lesson's picture. Without one (or if it fails to load) a green tile with a play button is shown. */
  src?: string | null;
  durationSeconds: number;
  completed?: boolean;
  /** Not enrolled yet: the picture is dimmed and shows a lock. */
  locked?: boolean;
  className?: string;
}

/**
 * The small picture on a lesson card: the thumbnail, a play button, the video length in the corner
 * and a tick once the lesson is completed. Decorative, so it is hidden from screen readers (the
 * card's text already says the same things).
 */
export function LessonThumb({
  src,
  durationSeconds,
  completed,
  locked,
  className,
}: LessonThumbProps) {
  const [failed, setFailed] = useState(false);

  return (
    <span
      aria-hidden
      className={cn(
        'relative block aspect-video w-28 shrink-0 overflow-hidden rounded-control bg-gradient-to-br from-spruce-600 to-spruce-900 sm:w-40',
        className,
      )}
    >
      {src && !failed && (
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      )}

      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex size-8 items-center justify-center rounded-full bg-white/90 text-spruce-800 shadow-card sm:size-10">
          {locked ? (
            <Lock className="size-4" />
          ) : (
            <Play className="size-4 translate-x-px" fill="currentColor" />
          )}
        </span>
      </span>

      {completed && (
        <span className="absolute top-1.5 left-1.5 flex size-5 items-center justify-center rounded-full bg-success text-white">
          <Check className="size-3" strokeWidth={3} />
        </span>
      )}
      <span className="absolute right-1.5 bottom-1.5 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white tnum">
        {formatDuration(durationSeconds)}
      </span>
    </span>
  );
}
