import { Check, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProgressBar } from '@/components/ui/progress';
import { cn } from '@/core/lib/cn';
import type { LessonSummary } from '@/core/types/lesson.types';
import { formatDuration } from '@/core/lib/format';
import { LessonThumb } from './lesson-thumb';

interface LessonCardProps {
  lesson: LessonSummary;
  to: string;
  /** The lesson currently being watched. */
  current?: boolean;
  /** Not enrolled yet: shows a lock instead of linking. */
  locked?: boolean;
  /** The last item has no line continuing below its node. */
  last?: boolean;
  /** Smaller picture and tighter padding, for the list beside the video. */
  compact?: boolean;
  /** The lesson to watch after the current one; labelled "Up next" until it is started. */
  next?: boolean;
}

/**
 * One step on a course's lesson path. Lessons are a real sequence, so each has a numbered node
 * joined by a line: filled spruce = done, pencil = in progress / current, outline = not started.
 * The same component is used on the course page and in the "up next" list beside the video.
 */
export function LessonCard({ lesson, to, current, locked, last, compact, next }: LessonCardProps) {
  const started = !lesson.completed && lesson.lastPositionSeconds > 0;

  const body = (
    <>
      <LessonThumb
        src={lesson.thumbnailUrl}
        durationSeconds={lesson.durationSeconds}
        completed={lesson.completed}
        locked={locked}
        compact={compact}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p
          className={cn(
            'leading-snug font-medium',
            compact && 'text-[0.95rem]',
            current && 'text-ink',
          )}
        >
          {lesson.title}
          <span className="sr-only">, {formatDuration(lesson.durationSeconds)}</span>
        </p>
        <p className="flex flex-wrap items-center gap-x-3 text-sm text-ink-faint tnum">
          {lesson.completed && <span className="font-medium text-success">Completed</span>}
          {started && (
            <span className="font-medium text-pencil-700">{lesson.progressPercent}% watched</span>
          )}
          {locked && <span>Enroll to unlock</span>}
          {!lesson.completed &&
            !started &&
            !locked &&
            (next ? (
              <span className="font-medium text-pencil-700">Up next</span>
            ) : (
              <span>Not started</span>
            ))}
        </p>
        {started && (
          <ProgressBar
            value={lesson.progressPercent}
            label={`${lesson.title} progress`}
            size="sm"
          />
        )}
      </div>
    </>
  );

  const cardClasses = cn(
    'flex flex-1 items-center gap-3 rounded-card border bg-surface text-left transition-[border-color,box-shadow] duration-150',
    compact ? 'p-2.5' : 'p-3.5',
    current ? 'border-pencil-500 shadow-card' : 'border-line',
    locked ? 'cursor-not-allowed opacity-70' : 'hover:border-spruce-300 hover:shadow-card',
  );

  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center" aria-hidden>
        <Node lesson={lesson} current={current} locked={locked} started={started} />
        {!last && <span className="mt-1 w-0.5 flex-1 rounded-full bg-line" />}
      </div>
      <div className={cn('flex min-w-0 flex-1', !last && 'pb-3')}>
        {locked ? (
          <div className={cardClasses} aria-disabled="true">
            {body}
          </div>
        ) : (
          <Link to={to} className={cardClasses} aria-current={current ? 'page' : undefined}>
            {body}
          </Link>
        )}
      </div>
    </li>
  );
}

function Node({
  lesson,
  current,
  locked,
  started,
}: {
  lesson: LessonSummary;
  current?: boolean;
  locked?: boolean;
  started: boolean;
}) {
  const base =
    'mt-3 flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold tnum';
  if (lesson.completed) {
    return (
      <span className={cn(base, 'bg-spruce-600 text-white')}>
        <Check className="size-4" strokeWidth={3} />
      </span>
    );
  }
  if (locked) {
    return (
      <span className={cn(base, 'border border-line-strong bg-sunken text-ink-faint')}>
        <Lock className="size-3.5" />
      </span>
    );
  }
  if (current || started) {
    return <span className={cn(base, 'bg-pencil-500 text-spruce-950')}>{lesson.order}</span>;
  }
  return (
    <span className={cn(base, 'border-2 border-line-strong bg-surface text-ink-soft')}>
      {lesson.order}
    </span>
  );
}
