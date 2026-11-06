import { ArrowRight, BookOpen, Check, Clock, ListVideo, Play, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress';
import { cn } from '@/core/lib/cn';
import { formatDuration, pluralize } from '@/core/lib/format';
import type { CourseStatus, CourseSummary } from '@/core/types/course.types';
import { ProgressStatusBadge } from './progress-status-badge';

/** What the row invites you to do, by where you are in the course. */
const NEXT_STEP: Record<CourseStatus, { label: string; icon: typeof Play }> = {
  NOT_STARTED: { label: 'Start course', icon: Play },
  IN_PROGRESS: { label: 'Continue', icon: ArrowRight },
  COMPLETED: { label: 'Review', icon: RotateCcw },
};

/**
 * One enrolled course on the "My learning" page: a wide row built for "where am I, and what next".
 * Cover with the pencil stroke along its edge, the status, lessons done out of the total, time left,
 * and one clear next step. The whole row is a single link (one tab stop), through the title.
 */
export function LearningRow({ course, to }: { course: CourseSummary; to: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = course.thumbnailUrl && !imageFailed;
  const done = course.status === 'COMPLETED';
  const step = NEXT_STEP[course.status];

  const lessonsLeft = course.lessonCount - course.completedLessons;
  // A rough "time left": the share of the total length that is still to do.
  const minutesLeft = Math.round(
    (course.totalDurationSeconds * (100 - course.progressPercent)) / 100 / 60,
  );

  return (
    <Card
      interactive
      padding="none"
      className="group/row relative flex flex-col overflow-hidden sm:flex-row"
    >
      <div className="relative aspect-[16/9] shrink-0 bg-spruce-100 sm:aspect-auto sm:w-56 lg:w-64">
        {showImage ? (
          <img
            src={course.thumbnailUrl ?? undefined}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="size-full object-cover transition-transform duration-500 group-hover/row:scale-[1.03] sm:absolute sm:inset-0"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-spruce-400 sm:absolute sm:inset-0">
            <BookOpen className="size-12" strokeWidth={1.3} aria-hidden />
          </div>
        )}
        {done && (
          <span className="absolute top-3 left-3 flex size-8 items-center justify-center rounded-full bg-success text-white shadow-card">
            <Check className="size-4" strokeWidth={3} aria-hidden />
            <span className="sr-only">Completed</span>
          </span>
        )}
        <ProgressBar
          value={course.progressPercent}
          label={`${course.title} progress`}
          size="sm"
          onDark
          className="absolute inset-x-0 bottom-0 h-1.5 rounded-none"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="brand">{course.category.name}</Badge>
          <ProgressStatusBadge status={course.status} />
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="font-display text-xl leading-snug font-semibold">
            <Link to={to} className="rounded-sm after:absolute after:inset-0 after:content-['']">
              {course.title}
            </Link>
          </h3>
          <p className="line-clamp-1 text-[0.95rem] text-ink-soft">{course.description}</p>
        </div>

        <div className="mt-auto flex flex-col gap-4 pt-1 md:flex-row md:items-end md:justify-between md:gap-8">
          <div className="flex min-w-0 flex-1 flex-col gap-2 md:max-w-md">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium tnum">
                {course.completedLessons} of {pluralize(course.lessonCount, 'lesson')} done
              </span>
              <span className={cn('tnum', done ? 'font-semibold text-success' : 'text-ink-faint')}>
                {course.progressPercent}%
              </span>
            </div>
            <ProgressBar value={course.progressPercent} label={`${course.title} progress`} />
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-faint">
              <span className="inline-flex items-center gap-1.5">
                <ListVideo className="size-4" aria-hidden />
                {done ? 'All lessons finished' : `${pluralize(lessonsLeft, 'lesson')} to go`}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4" aria-hidden />
                {done
                  ? `${formatDuration(course.totalDurationSeconds)} in total`
                  : `About ${formatDuration(Math.max(60, minutesLeft * 60))} left`}
              </span>
            </p>
          </div>

          {/* A look-alike button: the title link above is the real, single tab stop. */}
          <span
            aria-hidden
            className={cn(
              'inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors',
              done
                ? 'border border-line-strong bg-surface text-ink group-hover/row:bg-sunken/70'
                : 'bg-brand text-on-brand group-hover/row:bg-brand-hover',
            )}
          >
            <step.icon className="size-4" aria-hidden />
            {step.label}
          </span>
        </div>
      </div>
    </Card>
  );
}
