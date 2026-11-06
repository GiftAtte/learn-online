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
  /** A smaller picture for lesson lists in a narrow side column (beside the video). */
  compact?: boolean;
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
  compact,
  className,
}: LessonThumbProps) {
  const [failed, setFailed] = useState(false);

  return (
    <span
      aria-hidden
      className={cn(
        'relative block aspect-video shrink-0 overflow-hidden rounded-control bg-gradient-to-br from-spruce-600 to-spruce-900',
        compact ? 'w-24' : 'w-28 sm:w-40',
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
        <span
          className={cn(
            'flex items-center justify-center rounded-full bg-white/90 text-spruce-800 shadow-card',
            compact ? 'size-6' : 'size-8 sm:size-10',
          )}
        >
          {locked ? (
            <Lock className={compact ? 'size-3' : 'size-4'} />
          ) : (
            <Play
              className={cn('translate-x-px', compact ? 'size-3' : 'size-4')}
              fill="currentColor"
            />
          )}
        </span>
      </span>

      {completed && (
        <span className="absolute top-1.5 left-1.5 flex size-5 items-center justify-center rounded-full bg-success text-white">
          <Check className="size-3" strokeWidth={3} />
        </span>
      )}
      <span
        className={cn(
          'absolute right-1.5 bottom-1.5 rounded bg-black/70 px-1.5 py-0.5 font-medium text-white tnum',
          compact ? 'text-[0.7rem]' : 'text-xs',
        )}
      >
        {formatDuration(durationSeconds)}
      </span>
    </span>
  );
}
