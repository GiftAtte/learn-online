import { BookOpen, Clock, ListVideo } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress';
import { formatDuration, pluralize } from '@/core/lib/format';
import type { CourseSummary } from '@/core/types/course.types';
import { ProgressStatusBadge } from './progress-status-badge';

interface CourseCardProps {
  course: CourseSummary;
  /** Where the card links to. */
  to: string;
}

/**
 * Catalog / "my courses" card. The thumbnail carries the category and, for enrolled learners, the
 * pencil progress stroke along its bottom edge. The whole card is one link (a single tab stop).
 */
export function CourseCard({ course, to }: CourseCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const enrolled = course.enrolled ?? course.status !== 'NOT_STARTED';
  const showImage = course.thumbnailUrl && !imageFailed;

  return (
    <Card
      interactive
      padding="none"
      className="group/card relative flex h-full flex-col overflow-hidden"
    >
      <div className="relative aspect-[16/10] bg-spruce-100">
        {showImage ? (
          <img
            src={course.thumbnailUrl ?? undefined}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="size-full object-cover transition-transform duration-500 group-hover/card:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-spruce-300">
            <BookOpen className="size-10" strokeWidth={1.4} aria-hidden />
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <Badge tone="overlay">{course.category.name}</Badge>
          {!course.published && <Badge tone="warning">Draft</Badge>}
        </div>
        {enrolled && (
          <ProgressBar
            value={course.progressPercent}
            label={`${course.title} progress`}
            size="sm"
            onDark
            className="absolute inset-x-0 bottom-0 h-1.5 rounded-none"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <h3 className="text-lg leading-snug font-semibold">
          <Link to={to} className="rounded-sm after:absolute after:inset-0 after:content-['']">
            {course.title}
          </Link>
        </h3>
        <p className="line-clamp-2 text-[0.95rem] text-ink-soft">{course.description}</p>

        <dl className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-sm text-ink-faint">
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Duration</dt>
            <Clock className="size-4" aria-hidden />
            <dd className="tnum">{formatDuration(course.totalDurationSeconds)}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Lessons</dt>
            <ListVideo className="size-4" aria-hidden />
            <dd className="tnum">{pluralize(course.lessonCount, 'lesson')}</dd>
          </div>
        </dl>

        {enrolled && (
          <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
            <ProgressStatusBadge status={course.status} />
            <span className="text-sm text-ink-soft tnum">
              {course.completedLessons} of {course.lessonCount} done
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
