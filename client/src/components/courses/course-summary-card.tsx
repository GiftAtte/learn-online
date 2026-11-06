import { Clock, ListVideo, Users, type LucideIcon } from 'lucide-react';
import { Badge, Card, ProgressRing } from '@/components/ui';
import { cn } from '@/core/lib/cn';
import { formatDuration, pluralize } from '@/core/lib/format';
import type { CourseDetail } from '@/core/types/course.types';
import { CourseActions } from './course-actions';
import { ProgressStatusBadge } from './progress-status-badge';

/** One line of the facts list: an icon and a sentence. */
function Fact({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="size-4 text-ink-faint" aria-hidden />
      <dt className="sr-only">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/**
 * The side card on a course page: thumbnail, category and status, the learner's progress,
 * key facts, and the main action button.
 */
export function CourseSummaryCard({
  course,
  className,
}: {
  course: CourseDetail;
  className?: string;
}) {
  const enrolled = !!course.enrolled;

  return (
    <Card padding="none" className={cn('overflow-hidden', className)}>
      {course.thumbnailUrl && (
        <img src={course.thumbnailUrl} alt="" className="aspect-[16/10] w-full object-cover" />
      )}
      <div className="flex flex-col gap-5 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="brand">{course.category.name}</Badge>
          {!course.published && <Badge tone="warning">Draft</Badge>}
          {enrolled && <ProgressStatusBadge status={course.status} />}
        </div>

        {enrolled && (
          <div className="flex items-center gap-4">
            <ProgressRing value={course.progressPercent} label="Course progress" />
            <p className="text-[0.95rem] text-ink-soft tnum">
              {course.completedLessons} of {course.lessonCount} lessons done
            </p>
          </div>
        )}

        <dl className="flex flex-col gap-2.5 text-[0.95rem] text-ink-soft">
          <Fact icon={ListVideo} label="Lessons">
            {pluralize(course.lessonCount, 'lesson')}
          </Fact>
          <Fact icon={Clock} label="Total time">
            {`${formatDuration(course.totalDurationSeconds)} in total`}
          </Fact>
          {course.enrollmentCount !== undefined && (
            <Fact icon={Users} label="Learners">
              {`${pluralize(course.enrollmentCount, 'learner')} enrolled`}
            </Fact>
          )}
        </dl>

        <CourseActions course={course} />
      </div>
    </Card>
  );
}
